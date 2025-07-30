# backend/app.py
import os, random, string
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
from flask_mail import Mail, Message
from dotenv import load_dotenv
import bcrypt, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import base64
import tempfile

# OpenAI import with error handling
try:
    from openai import OpenAI
except ImportError:
    print("[OpenAI] OpenAI package not installed, AI features will be disabled")
    OpenAI = None

# ────────────── ENV / Flask / CORS ──────────────────
load_dotenv()

# Development mode flag - default to False in production
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")

# CORS configuration for production only
allowed_origins = [
    "https://aidiy-deployment-three.vercel.app",
    "https://web-production-a435c.up.railway.app",
    "http://localhost:3000",
]

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
)

# ────────────── Flask-Mail ──────────────────────────
app.config.update(
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_USE_TLS=os.getenv("MAIL_USE_TLS", "True") == "True",
    MAIL_USE_SSL=os.getenv("MAIL_USE_SSL", "False") == "True",
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_DEFAULT_SENDER=os.getenv("MAIL_USERNAME"),
)
mail = Mail(app)

# ────────────── MongoDB ─────────────────────────────
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["aidiy_app"]
users_col = db["users"]
pending_col = db["pending_users"]
otps_col = db["otps"]
children_col = db["children"]
goals_col = db["goals"]
notifications_col = db["notifications"]
chat_sessions_col = db["chat_sessions"]
chores_col = db["chores"]  # Moved to top level for consistency

# Enforce indexing for faster queries
chat_sessions_col.create_index("user_email")
chat_sessions_col.create_index("created_at")

# enforce kid-username uniqueness
try:
    children_col.create_index("username", unique=True)
except errors.OperationFailure:
    pass

# ────────────── Security helpers ────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24

def generate_jwt_token(payload: dict) -> str:
    return jwt.encode(
        {**payload, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS)},
        JWT_SECRET,
        algorithm="HS256",
    )

verify_jwt_token = lambda t: jwt.decode(t, JWT_SECRET, algorithms=["HS256"]) if t else None
hash_password = lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
check_password = lambda p, h: bcrypt.checkpw(p.encode(), h.encode())
random_otp = lambda: "".join(random.choices(string.digits, k=6))

OTP_EXP_MIN = 5
MAX_OTP_ATTEMPTS = 3

# ────────────── OTP helpers ─────────────────────────
def send_otp_email(email, code):
    try:
        body = (
            f"Your OTP code is {code}. It expires in {OTP_EXP_MIN} minutes.\n\n"
            "If you did not request this, please ignore."
        )
        mail.send(Message("Your AIDIY OTP Code", recipients=[email], body=body))
        print(f"[MAIL] OTP sent successfully to {email}")
        return True
    except Exception as e:
        print(f"[MAIL] Could not send OTP → {email}: {e}")
        # Print OTP to console in dev environment
        print(f"[DEV] OTP for {email}: {code}")
        return False

def create_or_replace_otp(email, purpose):
    code = random_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXP_MIN)
    otps_col.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "otp": code,
                "purpose": purpose,
                "expires_at": expires_at,
                "attempts": 0,
                "validated": False,
            }
        },
        upsert=True,
    )
    send_otp_email(email, code)
    return code

# ────────────── Routes ──────────────────────────────
@app.route("/")
def index():
    return jsonify(
        message="AIDIY API Server",
        status="running",
        time=datetime.now(timezone.utc).isoformat(),
        api_docs="Visit /api/health for health check"
    )

@app.route("/api/health")
def health():
    return jsonify(
        status="OK", 
        time=datetime.now(timezone.utc).isoformat(),
        ai_available=OpenAI is not None
    )

# ---------- 1  Registration ---------- #
REQUIRED_FIELDS = ("firstName", "lastName", "email", "password")  # slimmed down

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.get_json() or {}
    if not all(d.get(f) for f in REQUIRED_FIELDS):
        return jsonify(error="Missing required fields"), 400

    email = d["email"]
    if users_col.find_one({"email": email}):
        return jsonify(error="Email already verified"), 409

    pending_col.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "firstName": d["firstName"],
                "lastName": d["lastName"],
                "name": f"{d['firstName']} {d['lastName']}",
                "phoneNumber": d.get("phoneNumber"),
                "password": hash_password(d["password"]),
                # sensible defaults so backend is happy later
                "birthDate": d.get("birthDate", ""),
                "username": d.get("username", ""),
                "loginCode": d.get("loginCode", ""),
                "avatar": d.get("avatar", "🙂"),
                "isProfileComplete": False,  # New users default to incomplete profile
                "hasCompletedAssessment": False,  # New users haven't completed assessment
                "created_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    return (
        jsonify(success=True, message="Registration saved. Call /send-otp to get code."),
        201,
    )

# ---------- 2  Send / Resend OTP ---------- #
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    email = (request.get_json() or {}).get("email")
    if not email:
        return jsonify(error="Email required"), 400

    purpose = (
        "reset"
        if users_col.find_one({"email": email})
        else "verify"
        if pending_col.find_one({"email": email})
        else None
    )
    if not purpose:
        return jsonify(error="Email not found"), 404

    create_or_replace_otp(email, purpose)
    return jsonify(success=True, message=f"OTP sent for {purpose}"), 200

@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    return send_otp()

# ---------- 3  Verify OTP (handles sign-up + password-reset) ---------- #
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    d = request.get_json() or {}
    email, otp_input = d.get("email"), d.get("otp")

    # Find the OTP doc (any purpose) -----------------------------------
    rec = otps_col.find_one({"email": email})
    if not rec:
        return jsonify(error="No OTP found"), 404
    
    # Ensure rec["expires_at"] is timezone-aware
    expires_at = rec["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    expires_at = rec["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        otps_col.delete_one({"_id": rec["_id"]})
        return jsonify(error="OTP expired"), 400
    
    if datetime.now(timezone.utc) > expires_at:
        otps_col.delete_one({"_id": rec["_id"]})
        return jsonify(error="OTP expired"), 400
    
    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Too many attempts"), 403
    
    if otp_input != rec["otp"]:
        otps_col.update_one({"_id": rec["_id"]}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    # ---------- purpose-specific logic ----------
    if rec["purpose"] == "verify":
        # ✧ Sign-up / e-mail verification flow
        pending = pending_col.find_one({"email": email})
        if not pending:
            return jsonify(error="Pending registration missing"), 400
        pending["isVerified"] = True
        users_col.insert_one(pending)
        pending_col.delete_one({"email": email})
        # Remove OTP – it has served its purpose
        otps_col.delete_one({"_id": rec["_id"]})
        return jsonify(success=True, message="Email verified."), 200

    elif rec["purpose"] == "reset":
        # ✧ Password-reset flow
        otps_col.update_one(
            {"_id": rec["_id"]},
            {"$set": {"validated": True}, "$unset": {"otp": ""}}
        )
        return jsonify(success=True, message="OTP validated."), 200

    else:
        return jsonify(error="Unknown OTP purpose"), 400


# ---------- 4  Reset password ---------- #
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    d = request.get_json() or {}

    # the UI sends { email, newPassword }
    email     = d.get("email")
    new_pwd   = d.get("newPassword")   # keep the exact key the UI sends
    # you can also accept an alias if you like:
    # new_pwd = d.get("newPassword") or d.get("password")

    if not email or not new_pwd:
        return jsonify(error="Email and newPassword required"), 400

    doc = otps_col.find_one(
        {"email": email, "purpose": "reset", "validated": True}
    )
    if not doc:
        return jsonify(error="OTP not validated"), 403

    users_col.update_one(
        {"email": email},
        {"$set": {"password": hash_password(new_pwd)}}
    )
    # delete the OTP after successful reset so it can't be reused
    otps_col.delete_one({"_id": doc["_id"]})

    return jsonify(success=True, message="Password reset successfully"), 200

# ---------- 5  Parent login ---------- #
@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json() or {}
    email, pwd = d.get("email"), d.get("password")
    if not email or not pwd:
        return jsonify(error="Email and password required"), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password(pwd, user["password"]):
        return jsonify(error="Invalid credentials"), 401

    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

@app.route("/api/auth/logout", methods=["POST"])
def logout_route():
    return jsonify(success=True)

# ---------- 6  Google sign-in ---------- #
CLIENT_ID = "1096697062195-l7ip7k3ib9en1gferiklgca206dnpeoj.apps.googleusercontent.com"

@app.route("/auth/google", methods=["POST"])
def google_login():
    tok = (request.get_json() or {}).get("token")
    if not tok:
        return jsonify(success=False, error="No token provided"), 400
    try:
        info = id_token.verify_oauth2_token(tok, google_requests.Request(), CLIENT_ID)
    except Exception as e:
        print(f"[Google Auth Error] {type(e).__name__}: {str(e)}")
        return jsonify(success=False, error=f"Token verification failed: {str(e)}"), 400

    email = info["email"]
    user = users_col.find_one({"email": email})

    if not user:
        user = {
            "email": email,
            "name": info.get("name"),
            "firstName": info.get("given_name"),
            "lastName": info.get("family_name"),
            "picture": info.get("picture"),
            "login_type": "google",
            "isVerified": True,  # Auto-verify in dev mode
            "password": None,
            "isProfileComplete": False,
            "hasCompletedAssessment": False,
        }
        users_col.insert_one(user)
    else:


      # Skip OTP verification in dev mode
      if not user.get("isVerified") and not DEV_MODE:
         users_col.update_one({"email": email}, {"$set": {"isVerified": True}})
         user["isVerified"] = True

    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    token = generate_jwt_token({"email": email, "name": user["name"]})

    return jsonify(
        success=True,
        user={
            "email": email,
            "name": user["name"],
            "isProfileComplete": isProfileComplete
        },
        appToken=token
    ), 200

#@app.route("/auth/google/verify-otp", methods=["POST"])
#def google_verify_otp():
#    d = request.get_json() or {}
#    email, otp_input = d.get("email"), d.get("otp")
#
#    rec = otps_col.find_one({"email": email, "purpose": "verify"})
#    if not rec:
#        return jsonify(error="Invalid OTP"), 400
#    if datetime.now(timezone.utc) > rec["expires_at"]:
#        return jsonify(error="OTP expired"), 400
#    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
#        return jsonify(error="Too many attempts"), 403
#    if otp_input != rec["otp"]:
#        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
#        return jsonify(error="Incorrect OTP"), 400
#
#    users_col.update_one({"email": email}, {"$set": {"isVerified": True}})
#    otps_col.delete_one({"email": email})
#
#    user = users_col.find_one({"email": email})
#    # Check if user profile is complete
#    isProfileComplete = user.get("isProfileComplete", False)
#    
#    tok = generate_jwt_token({"email": email, "name": user["name"]})
#    return jsonify(
#        success=True,
#        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
#        appToken=tok,
#    )

# ---------- 7  Kid login ---------- #
@app.route("/api/auth/kid-login", methods=["POST"])
def kid_login():
    d = request.get_json() or {}
    username = d.get("username", "").strip()
    code = d.get("code", "")
    if not username or len(code) != 4 or not code.isdigit():
        return jsonify(error="Username and 4-digit code required"), 400

    child = children_col.find_one({"username": username, "loginCode": code})
    if not child:
        return jsonify(error="Invalid kid credentials"), 401

    tok = generate_jwt_token(
        {
            "email": f"{username}@kids.aidiy",
            "name": child.get("nickName") or child["firstName"],
            "username": username,
        }
    )
    return jsonify(
        success=True,
        user={
            "username": username,
            "name": child.get("nickName") or child["firstName"],
            "nickName": child.get("nickName", ""),          # Add nickname
            "firstName": child["firstName"],
            "avatar": child.get("avatar", "👧")  
        },
        appToken=tok,
    )

# ---------- 8  Auth decorator ---------- #
def auth_required(fn):
    def inner(*a, **kw):
        hdr = request.headers.get("Authorization", "")
        if not hdr.startswith("Bearer "):
            return jsonify(error="No token"), 401
        try:
            request.user = verify_jwt_token(hdr[7:])
        except jwt.ExpiredSignatureError:
            return jsonify(error="Token expired"), 401
        except Exception:
            return jsonify(error="Invalid token"), 401
        return fn(*a, **kw)

    inner.__name__ = fn.__name__
    return inner

@app.route("/api/users/profile")
@auth_required
def profile():
    user = users_col.find_one({"email": request.user["email"]}, {"_id": 0, "password": 0})

    # If this is a kid user, add their savings information
    if user and "@kids.aidiy" in user.get("email", ""):
        kid_username = user["email"].split("@")[0]
        
        # Get child's goals to calculate total savings
        child_goals = list(goals_col.find({"kid_username": kid_username}))
        total_savings = sum([g.get("saved", 0) for g in child_goals])
        total_goals = len(child_goals)
        active_goals = len([g for g in child_goals if g.get("status") == "approved"])
        completed_goals = len([g for g in child_goals if g.get("status") == "completed"])
        
        # Add financial information to user profile
        user["financial_info"] = {
            "total_savings": total_savings,
            "total_goals": total_goals,
            "active_goals": active_goals,
            "completed_goals": completed_goals
        }

    return jsonify(success=True, user=user)

# ---------- Update user profile ---------- #
@app.route("/api/users/profile", methods=["PUT"])
@auth_required
def update_profile():
    d = request.get_json() or {}
    
    # Allowed fields to update
    allowed_fields = ["firstName", "lastName", "phoneNumber", "birthDate", "parentRole", "spouse", "parents", "choreCategories"]
    update_data = {k: v for k, v in d.items() if k in allowed_fields and v is not None}
    
    # Special handling for parents array
    if "parents" in update_data:
        # When updating parents, merge with existing data
        user = users_col.find_one({"email": request.user["email"]})
        existing_parents = user.get("parents", [])
        new_parents = update_data["parents"]
        
        # Create a dict to track parents by role for easy merging
        parents_dict = {p["role"]: p for p in existing_parents}
        
        # Update or add new parents
        for parent in new_parents:
            parents_dict[parent["role"]] = parent
        
        # Convert back to list
        update_data["parents"] = list(parents_dict.values())
    
    if update_data:
        # If firstName and lastName exist, update name field
        if "firstName" in update_data or "lastName" in update_data:
            user = users_col.find_one({"email": request.user["email"]})
            firstName = update_data.get("firstName", user.get("firstName", ""))
            lastName = update_data.get("lastName", user.get("lastName", ""))
            update_data["name"] = f"{firstName} {lastName}"
        
        # Mark profile as complete
        update_data["isProfileComplete"] = True
        
        users_col.update_one(
            {"email": request.user["email"]},
            {"$set": update_data}
        )
        
        return jsonify(success=True, message="Profile updated successfully")
    
    return jsonify(error="No valid fields to update"), 400

# ---------- Children management ---------- #
@app.route("/api/users/children")
@auth_required
def children_get():
    kids = list(
        children_col.find({"parent_email": request.user["email"]}, {"_id": 0})
    )
    return jsonify(success=True, children=kids)

@app.route("/api/users/children", methods=["POST"])
@auth_required
def children_add():
    d = request.get_json() or {}
    required = ("firstName", "lastName", "birthDate", "loginCode", "username")
    if not all(d.get(k) for k in required):
        return jsonify(error="Missing fields"), 400

    if children_col.find_one({"username": d["username"]}):
        return jsonify(error="Username already taken"), 409

    child = {
        "parent_email": request.user["email"],
        "id": d["loginCode"],
        "username": d["username"],
        "firstName": d["firstName"],
        "lastName": d["lastName"],
        "nickName": d.get("nickName", ""),
        "avatar": d.get("avatar", "👧"),
        "birthDate": d["birthDate"],
        "loginCode": d["loginCode"],
        "moneyAccumulated": 0,
        "tasksAssigned": 0,
        "tasksCompleted": 0,
        "created_at": datetime.now(timezone.utc),
    }

    children_col.insert_one(child)
    child.pop("_id", None)
    return jsonify(success=True, child=child), 201

@app.route("/api/users/children/<username>", methods=["PUT"])
@auth_required
def update_child(username):
    d = request.get_json() or {}

    allowed = {"firstName", "lastName", "nickName", "avatar", "birthDate", "loginCode", "username"}
    update_data = {k: v for k, v in d.items() if k in allowed and v is not None}

    if not update_data:
        return jsonify(error="No valid fields to update"), 400

    # Make sure the child belongs to the logged-in parent
    child = children_col.find_one({"username": username, "parent_email": request.user["email"]})
    if not child:
        return jsonify(error="Child not found"), 404

    # Prevent username conflict if it's being changed
    if "username" in update_data and update_data["username"] != username:
        if children_col.find_one({"username": update_data["username"]}):
            return jsonify(error="Username already taken"), 409

    children_col.update_one(
        {"username": username, "parent_email": request.user["email"]},
        {"$set": update_data}
    )

    updated = children_col.find_one({"username": update_data.get("username", username)})
    updated.pop("_id", None)
    return jsonify(success=True, child=updated)

# ---------- AI Chat and Speech endpoints ---------- #
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/api/chat/sessions", methods=["POST"])
@auth_required
def create_chat_session():
    user_email = request.user["email"]
    # We create an *empty* shell here; it will get its first message a moment later
    result = chat_sessions_col.insert_one({
        "user_email":  user_email,
        "title":       "New Chat",
        "messages":    [],                 # empty until first real message
        "created_at":  datetime.utcnow(),
        "updated_at":  datetime.utcnow()
    })
    return jsonify(success=True, session_id=str(result.inserted_id))
    return jsonify(
        success=True,
        session_id=str(result.inserted_id),
        title=title
    )

@app.route("/api/chat/sessions", methods=["GET"])
@auth_required
def get_chat_sessions():
    sessions = list(chat_sessions_col.find(
        {"user_email": request.user["email"]},
        {"messages": 0}  # Exclude messages for list view
    ).sort("updated_at", -1).limit(20))
    
    for session in sessions:
        session["_id"] = str(session["_id"])
        session["created_at"] = session["created_at"].isoformat()
        session["updated_at"] = session["updated_at"].isoformat()
    
    return jsonify(success=True, sessions=sessions)

@app.route("/api/chat/sessions/<session_id>", methods=["GET"])
@auth_required
def get_chat_session(session_id):
    try:
        session = chat_sessions_col.find_one(
            {"_id": ObjectId(session_id), "user_email": request.user["email"]}
        )
        if not session:
            return jsonify(error="Session not found"), 404
            
        session["_id"] = str(session["_id"])
        session["created_at"] = session["created_at"].isoformat()
        session["updated_at"] = session["updated_at"].isoformat()
        
        # Convert message timestamps
        for msg in session["messages"]:
            msg["timestamp"] = msg["timestamp"].isoformat()
        
        return jsonify(success=True, session=session)
    except Exception as e:
        return jsonify(error="Invalid session ID"), 400

@app.route("/api/chat/sessions/<session_id>", methods=["PUT"])
@auth_required
def update_chat_session(session_id):
    try:
        title = request.json.get("title")
        if not title:
            return jsonify(error="Title required"), 400
            
        result = chat_sessions_col.update_one(
            {"_id": ObjectId(session_id), "user_email": request.user["email"]},
            {"$set": {"title": title, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify(error="Session not found"), 404
            
        return jsonify(success=True)
    except Exception as e:
        return jsonify(error="Invalid session ID"), 400

@app.route("/api/chat/sessions/<session_id>", methods=["DELETE"])
@auth_required
def delete_chat_session(session_id):
    try:
        result = chat_sessions_col.delete_one(
            {"_id": ObjectId(session_id), "user_email": request.user["email"]}
        )
        if result.deleted_count == 0:
            return jsonify(error="Session not found"), 404
        return jsonify(success=True)
    except Exception as e:
        return jsonify(error="Invalid session ID"), 400

from datetime import datetime
from bson.objectid import ObjectId

@app.route("/api/ai/chat", methods=["POST"])
@auth_required
def ai_chat():
    try:
        d = request.get_json() or {}
        message = d.get("message", "")
        image_base64 = d.get("image")
        session_id = d.get("session_id")  # May be None for new chat
        
        if not message and not image_base64:
            return jsonify(error="Message or image required"), 400

        # Prepare messages for OpenAI call
        messages = [
            {"role": "system", "content": "You are a helpful financial coach..."},
            {"role": "user", "content": message}
        ]
        if image_base64:
            messages[-1]["content"] = [
                {"type": "text", "text": message},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o" if image_base64 else "gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        ai_response = response.choices[0].message.content

        # Prepare the user and assistant message entries
        user_msg = {
            "role": "user",
            "content": message,
            "image": image_base64,
            "timestamp": datetime.utcnow()
        }
        assistant_msg = {
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow()
        }

        if not session_id:
            # No existing session: create a new session document
            # Set title based on first user message (or a default if empty)
            title_snippet = (message[:30] + "...") if message else "New Chat"
            new_session = {
                "user_email": request.user["email"],
                "title": f"Chat: {title_snippet}",
                "messages": [user_msg, assistant_msg],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = chat_sessions_col.insert_one(new_session)
            session_id = str(result.inserted_id)
        else:
            # Existing session: append messages
            session_obj = chat_sessions_col.find_one({"_id": ObjectId(session_id)})
            is_first_message = (session_obj and len(session_obj.get("messages", [])) == 0)
            update_data = {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": datetime.utcnow()}
            }
            if is_first_message:
                # Update title on first message
                title_snippet = (message[:30] + "...") if message else "New Chat"
                update_data["$set"]["title"] = f"Chat: {title_snippet}"
            chat_sessions_col.update_one({"_id": ObjectId(session_id)}, update_data)

        return jsonify(success=True, response=ai_response, session_id=session_id)
    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return jsonify(error="Failed to process AI request"), 500


@app.route("/api/ai/speech-to-text", methods=["POST"])
@auth_required
def speech_to_text():
    try:
        # Get audio file from request
        if 'audio' not in request.files:
            return jsonify(error="No audio file provided"), 400
        
        audio_file = request.files['audio']
        
        # Determine file extension from filename
        filename = audio_file.filename
        extension = filename.split('.')[-1] if '.' in filename else 'webm'
        
        # Save audio to temporary file with correct extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{extension}') as tmp_file:
            audio_file.save(tmp_file.name)
            tmp_file_path = tmp_file.name
        
        try:
            # Use OpenAI Whisper API for speech-to-text
            with open(tmp_file_path, 'rb') as audio_file:
                # Read the file content
                audio_data = audio_file.read()
            
            # Create a new file-like object with the correct name
            from io import BytesIO
            audio_buffer = BytesIO(audio_data)
            audio_buffer.name = f"audio.{extension}"
            
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_buffer,
                language="en"
            )
            
            text = transcript.text
            print(f"[Speech-to-Text Success] Transcribed: {text[:50]}...")
            
            return jsonify(success=True, text=text)
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        print(f"[Speech-to-Text Error] {e}")
        import traceback
        traceback.print_exc()
        return jsonify(error=f"Failed to process audio: {str(e)}"), 500

# ---------- Recommend chores to parent ---------- #
@app.route("/api/chores/recommendations", methods=["GET"])
@auth_required
def generate_chore_recommendations():
    try:
        # 1. Get the current user based on JWT-protected request
        user = users_col.find_one({"email": request.user["email"]})
        categories = user.get("choreCategories", [])

        # 2. If user has no saved categories, return an empty list
        if not categories:
            return jsonify(success=True, recommendations=[])
        
        prompt = (
            f"Generate 5 age-appropriate chores for kids in the following categories only: "
            f"{', '.join(categories)}. "
            f"Respond only with a JSON array of objects with a 'title' and 'description'. "
            f"Do NOT include code blocks, markdown, or any explanation."
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant who generates chore ideas for kids. "
                        "Respond only with a JSON array of objects, each containing a 'title' and 'description'. "
                        "Do NOT include code blocks, markdown, or any explanation."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=300
        )

        raw_output = response.choices[0].message.content
        print("[AI RAW RESPONSE]", raw_output)
        # Try to parse it into JSON
        import json
        chores = json.loads(raw_output)

        return jsonify(success=True, recommendations=chores)

    except Exception as e:
        print(f"[AI Chore Recommendation Error] {e}")
        return jsonify(error="Could not generate recommendations"), 500


# ---------- Goals management ---------- #

def get_user_username_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "")
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded.get("username")  # <- this must match your JWT payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@app.route("/api/goals", methods=["GET"])
@auth_required
def get_goals():
    """Get goals with consistent field names"""
    email = request.user.get("email", "")
    kid_username = email.split("@")[0]

    child = children_col.find_one({"username": kid_username})
    if not child:
        return jsonify({"success": False, "error": "Child not found"}), 404

    try:
        raw_goals = goals_col.find({"kid_username": kid_username})
        goals = []
        for g in raw_goals:
            g["_id"] = str(g["_id"])
            
            # Ensure consistent field names
            if "currentAmount" in g and "saved" not in g:
                g["saved"] = g["currentAmount"]
            elif "saved" in g and "currentAmount" not in g:
                g["currentAmount"] = g["saved"]
            elif "saved" not in g and "currentAmount" not in g:
                g["saved"] = 0
                g["currentAmount"] = 0
                
            # Ensure progress field exists
            if "progress" not in g:
                amount = g.get("amount", 0)
                saved = g.get("saved", 0)
                g["progress"] = min((saved / amount * 100) if amount > 0 else 0, 100)
            
            goals.append(g)

        return jsonify({"success": True, "goals": goals}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------- Mark assessment complete ---------- #
@app.route("/api/users/complete-assessment", methods=["POST"])
@auth_required
def complete_assessment():
    users_col.update_one(
        {"email": request.user["email"]},
        {"$set": {"hasCompletedAssessment": True}}
    )
    return jsonify(success=True, message="Assessment marked as complete")

@app.route("/api/goals", methods=["POST"])
@auth_required
def create_goal():
    d = request.get_json() or {}
    
    # Check if this is a kid creating a goal
    if "@kids.aidiy" in request.user["email"]:
        # Extract kid username from email
        kid_username = request.user["email"].split("@")[0]
        
        # Find the kid's parent
        child = children_col.find_one({"username": kid_username})
        if not child:
            return jsonify(error="Child not found"), 404
        
        goal = {
            "title": d.get("title"),
            "category": d.get("category"),
            "amount": float(d.get("amount", 0)),
            "duration": int(d.get("duration", 10)),
            "description": d.get("description", ""),
            "kid_username": kid_username,
            "kid_name": child.get("nickName") or child["firstName"],
            "kid_avatar": child.get("avatar", "👧"),
            "parent_email": child["parent_email"],
            "status": "pending_approval",
            "created_at": datetime.utcnow(),
            "approved_at": None,
            "approved_by": None
        }
        
        result = goals_col.insert_one(goal)
        goal["_id"] = str(result.inserted_id)
        
        # Create notification for parent
        notification = {
            "recipient_email": child["parent_email"],
            "type": "goal_approval_request",
            "title": f"{goal['kid_name']} wants to save ${goal['amount']:.2f}",
            "message": f"for {goal['title']}",
            "goal_id": str(result.inserted_id),
            "kid_username": kid_username,
            "kid_avatar": goal['kid_avatar'],
            "status": "pending",
            "read": False,
            "created_at": datetime.utcnow()
        }
        notifications_col.insert_one(notification)
        
        return jsonify(success=True, goal=goal), 201
    
    return jsonify(error="Only kids can create goals"), 403

@app.route("/api/goals/<goal_id>/approve", methods=["POST"])
@auth_required
def approve_goal(goal_id):
    from bson import ObjectId
    
    try:
        goal = goals_col.find_one({"_id": ObjectId(goal_id)})
        if not goal:
            return jsonify(error="Goal not found"), 404
        
        # Check if the user is the parent of the kid
        if goal["parent_email"] != request.user["email"]:
            return jsonify(error="Unauthorized"), 403
        
        # Update goal status
        goals_col.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$set": {
                    "status": "approved",
                    "approved_at": datetime.utcnow(),
                    "approved_by": request.user["email"]
                }
            }
        )
        
        # Update notification status instead of marking as read
        notifications_col.update_many(
            {"goal_id": goal_id},
            {"$set": {"status": "approved"}}
        )
        
        return jsonify(success=True, message="Goal approved")
        
    except Exception as e:
        return jsonify(error=str(e)), 400

@app.route("/api/goals/<goal_id>/decline", methods=["POST"])
@auth_required
def decline_goal(goal_id):
    from bson import ObjectId
    
    try:
        goal = goals_col.find_one({"_id": ObjectId(goal_id)})
        if not goal:
            return jsonify(error="Goal not found"), 404
        
        # Check if the user is the parent of the kid
        if goal["parent_email"] != request.user["email"]:
            return jsonify(error="Unauthorized"), 403
        
        # Update goal status
        goals_col.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$set": {
                    "status": "declined",
                    "declined_at": datetime.utcnow(),
                    "declined_by": request.user["email"]
                }
            }
        )
        
        # Update notification status instead of marking as read
        notifications_col.update_many(
            {"goal_id": goal_id},
            {"$set": {"status": "declined"}}
        )
        
        return jsonify(success=True, message="Goal declined")
        
    except Exception as e:
        return jsonify(error=str(e)), 400
    
# ---------- Parent Goals API ---------- #
@app.route("/api/parent/goals", methods=["GET"])
@auth_required
def get_parent_goals():
    """Get all goals for parent's children"""
    try:
        # Get all goals where parent_email matches the logged-in parent
        raw_goals = goals_col.find({"parent_email": request.user["email"]})
        goals = []
        for g in raw_goals:
            g["_id"] = str(g["_id"])
            # Convert datetime to ISO format if exists
            if "created_at" in g and hasattr(g["created_at"], "isoformat"):
                g["created_at"] = g["created_at"].isoformat()
            if "approved_at" in g and hasattr(g["approved_at"], "isoformat"):
                g["approved_at"] = g["approved_at"].isoformat()
            goals.append(g)
        
        return jsonify(success=True, goals=goals), 200
    except Exception as e:
        print(f"[Parent Goals Error] {e}")
        return jsonify(error=str(e)), 500

@app.route("/api/parent/children-progress", methods=["GET"])
@auth_required
def get_children_progress():
    """Get progress data for all parent's children"""
    try:
        # Get all children for this parent
        children = list(children_col.find({"parent_email": request.user["email"]}, {"_id": 0}))
        
        # Get goals and chores data for each child
        for child in children:
            username = child["username"]
            
            # Get child's goals
            child_goals = list(goals_col.find({"kid_username": username}))
            for goal in child_goals:
                goal["_id"] = str(goal["_id"])
            
            # Get completed/pending counts
            completed_goals = len([g for g in child_goals if g.get("status") == "completed"])
            active_goals = len([g for g in child_goals if g.get("status") == "approved"])
            
            child["goals"] = child_goals
            child["completed_goals"] = completed_goals
            child["active_goals"] = active_goals
            child["total_saved"] = sum([g.get("saved", 0) for g in child_goals])
        
        return jsonify(success=True, children=children), 200
    except Exception as e:
        print(f"[Children Progress Error] {e}")
        return jsonify(error=str(e)), 500

# ---------- Chores API ---------- #
chores_col.create_index([("parent_email", 1)])

@app.route("/api/chores", methods=["GET"])
@auth_required
def get_chores():
    """
    Return chores based on user type, excluding archived chores
    """
    try:
        # Base query to exclude archived chores
        base_query = {"is_active": {"$ne": False}}
        
        # Check if this is a kid user
        if "@kids.aidiy" in request.user["email"]:
            # Extract kid username from email
            kid_username = request.user["email"].split("@")[0]
            q = {**base_query, "kid_username": kid_username}
            
            # Optional: filter by goal
            goal_id = request.args.get("goalId")
            if goal_id:
                q["assigned_goal_id"] = goal_id
        else:
            # Parent user - get all their active chores
            q = {**base_query, "parent_email": request.user["email"]}
            
            # Optional filters for parents
            kid = request.args.get("kid")
            status = request.args.get("status")
            if kid:
                q["kid_username"] = kid
            if status:
                q["status"] = status

        chores = []
        for c in chores_col.find(q):
            c["id"] = str(c.pop("_id"))
            # Convert datetime to ISO format
            if "created_at" in c and hasattr(c["created_at"], "isoformat"):
                c["created_at"] = c["created_at"].isoformat()
            if "updated_at" in c and hasattr(c["updated_at"], "isoformat"):
                c["updated_at"] = c["updated_at"].isoformat()
            chores.append(c)

        return jsonify(success=True, chores=chores), 200
    except Exception as e:
        print("[Chores GET error]", e)
        return jsonify(error=str(e)), 500

@app.route("/api/chores", methods=["POST"])
@auth_required
def create_chore():
    """
    Parent creates a chore. Body must include at least
    title, description, category, difficulty, reward, dueDate.
    """
    d = request.get_json() or {}
    required = ("title", "description", "category", "difficulty", "reward", "dueDate")
    if not all(d.get(k) for k in required):
        return jsonify(error="Missing required fields"), 400

    # optional assignment at creation time
    kid_username = d.get("assignedTo")  # can be None / '' for unassigned

    chore = {
        "parent_email": request.user["email"],
        "kid_username": kid_username,        # None if not yet assigned
        "title": d["title"],
        "description": d["description"],
        "category": d["category"],
        "difficulty": d["difficulty"],
        "reward": float(d["reward"]),
        "status": "Assigned" if kid_username else "Pending",
        "dueDate": d["dueDate"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = chores_col.insert_one(chore)
    chore["id"] = str(result.inserted_id)
    chore.pop("_id", None)
    return jsonify(success=True, chore=chore), 201

@app.route("/api/chores/<chore_id>", methods=["PUT"])
@auth_required
def update_chore(chore_id):
    d = request.get_json() or {}
    allowed = {
        "title", "description", "category", "difficulty",
        "reward", "dueDate", "status", "assignedTo"
    }
    update_data = {k: d[k] for k in allowed if k in d}

    if not update_data:
        return jsonify(error="No valid fields to update"), 400

    update_data["updated_at"] = datetime.utcnow()

    res = chores_col.update_one(
        {"_id": ObjectId(chore_id), "parent_email": request.user["email"]},
        {"$set": update_data}
    )
    if res.matched_count == 0:
        return jsonify(error="Chore not found"), 404

    updated = chores_col.find_one({"_id": ObjectId(chore_id)})
    updated["id"] = chore_id
    updated.pop("_id", None)
    return jsonify(success=True, chore=updated)

@app.route("/api/chores/<chore_id>", methods=["DELETE"])
@auth_required
def delete_chore(chore_id):
    res = chores_col.delete_one(
        {"_id": ObjectId(chore_id), "parent_email": request.user["email"]}
    )
    if res.deleted_count == 0:
        return jsonify(error="Chore not found"), 404
    return '', 204


@app.route("/api/chores/recommendations", methods=["GET"])
@auth_required
def get_chore_recommendations():
    """Get AI recommended chores based on children's ages and goals"""
    try:
        # Get children for context
        children = list(children_col.find({"parent_email": request.user["email"]}, {"_id": 0}))
        
        # Mock AI recommendations - can be enhanced with real AI later
        recommendations = [
            {
                "title": "Learn to make pancakes",
                "description": "Follow the recipe and make pancakes for family breakfast",
                "category": "Kitchen",
                "difficulty": "Hard",
                "reward": 8.00,
                "dueDate": "May 24, 2025"
            },
            {
                "title": "Help with dishes", 
                "description": "Load dishwasher and wipe down counters",
                "category": "Kitchen",
                "difficulty": "Medium",
                "reward": 5.00,
                "dueDate": "May 24, 2025"
            },
            {
                "title": "Clean bedroom",
                "description": "Make bed, organize toys, and put clothes away", 
                "category": "Cleaning",
                "difficulty": "Easy",
                "reward": 2.00,
                "dueDate": "May 24, 2025"
            },
            {
                "title": "Take out trash",
                "description": "Make bed, organize toys, and put clothes away",
                "category": "Cleaning", 
                "difficulty": "Easy",
                "reward": 2.00,
                "dueDate": "May 24, 2025"
            }
        ]
        
        return jsonify(success=True, recommendations=recommendations), 200
    except Exception as e:
        print(f"[Chore Recommendations Error] {e}")
        return jsonify(error=str(e)), 500

@app.route("/api/parent/children-chores", methods=["GET"])
@auth_required
def get_children_chores():
    try:
        children = list(children_col.find(
            {"parent_email": request.user["email"]}, {"_id": 0}
        ))

        for child in children:
            username = child["username"]

            # ⬇️  NEW — pull real chores for this kid
            child_chores = list(
                chores_col.find({"kid_username": username}, {"_id": 0})
            )

            child["assigned_chores"]  = child_chores
            child["chores_completed"] = len([c for c in child_chores
                                             if c["status"] == "completed"])
            child["chores_pending"]   = len([c for c in child_chores
                                             if c["status"] in ("pending",
                                                                "in_progress")])
            child["total_earned"]     = sum(c["reward"] for c in child_chores
                                            if c["status"] == "completed")

        return jsonify(success=True, children=children), 200
    except Exception as e:
        print("[Children Chores Error]", e)
        return jsonify(error=str(e)), 500

@app.route("/api/goals/submit-progress", methods=["POST"])
@auth_required
def submit_progress():
    """Handle child's progress submission for completed chores"""
    try:
        data = request.get_json()
        goal_id = data.get("goalId")
        completed_chore_ids = data.get("completedChoreIds", [])
        total_earned = data.get("totalEarned", 0)
        submission_date = data.get("submissionDate")

        if not goal_id or not completed_chore_ids:
            return jsonify(error="Missing required data"), 400

        # Get current goal
        current_goal = goals_col.find_one({"_id": ObjectId(goal_id)})
        if not current_goal:
            return jsonify(error="Goal not found"), 404
        
        # Get kid's username from email
        kid_username = request.user["email"].split("@")[0]
        
        # Find the kid's details
        child = children_col.find_one({"username": kid_username})
        if not child:
            return jsonify(error="Child not found"), 404
        
        # Get chore details from IDs - IMPORTANT: Only get the submitted chores
        completed_chores = []
        for chore_id in completed_chore_ids:
            chore = chores_col.find_one({"_id": ObjectId(chore_id)})
            if chore:
                completed_chores.append({
                    "id": str(chore["_id"]),
                    "title": chore.get("title", ""),
                    "reward": chore.get("reward", 0)
                })

        # Create notification for parents with ONLY the submitted chores
        notification = {
            "type": "progress_submission",
            "title": f"{child.get('nickName', child.get('firstName'))} completed chores!",
            "message": f"Your child completed {len(completed_chores)} chore(s) and earned ${total_earned:.2f}",
            "kid_name": child.get('nickName', child.get('firstName')),
            "kid_avatar": child.get('avatar', '👧'),
            "goal_id": goal_id,
            "earned_amount": total_earned,
            "completed_chore_ids": completed_chore_ids,  # Only the submitted chore IDs
            "completed_chores": completed_chores,  # Only the submitted chore details
            "status": "pending",
            "read": False,
            "created_at": datetime.utcnow(),
            "recipient_email": child["parent_email"]
        }

        # Add to notifications collection
        notifications_col.insert_one(notification)

        # Mark ONLY the submitted chores as "pending_approval"
        for chore_id in completed_chore_ids:
            chores_col.update_one(
                {"_id": ObjectId(chore_id)},
                {"$set": {
                    "status": "pending_approval",
                    "submitted_at": datetime.utcnow()
                }}
            )

        return jsonify(
            success=True, 
            message="Progress submitted to parents for approval!"
        ), 200

    except Exception as e:
        print(f"[Submit Progress Error] {e}")
        return jsonify(error=str(e)), 500


@app.route("/api/progress/<submission_id>/approve", methods=["POST"])
@auth_required
def approve_progress_submission(submission_id):
    """Approve child's progress submission and update savings"""
    try:
        # Find the progress submission notification
        submission = notifications_col.find_one(
            {"_id": ObjectId(submission_id), "type": "progress_submission"}
        )
        if not submission:
            return jsonify(error="Submission not found"), 404

        # Verify the user is the parent
        if submission["recipient_email"] != request.user["email"]:
            return jsonify(error="Unauthorized"), 403

        # Get the associated goal
        goal = goals_col.find_one({"_id": ObjectId(submission["goal_id"])})
        if not goal:
            return jsonify(error="Goal not found"), 404
        
        # Calculate new saved amount
        current_saved = goal.get("saved", goal.get("currentAmount", 0))
        new_saved = current_saved + submission["earned_amount"]
        
        # Calculate progress percentage
        goal_amount = goal.get("amount", 0)
        new_progress = min((new_saved / goal_amount * 100) if goal_amount > 0 else 0, 100)
        
        # Check if goal is being completed
        goal_completed = new_saved >= goal_amount and current_saved < goal_amount
        
        # Update the goal
        update_data = {
            "$set": {
                "saved": new_saved,
                "currentAmount": new_saved,
                "progress": new_progress
            },
            "$push": {
                "progress_history": {
                    "date": datetime.utcnow(),
                    "amount": submission["earned_amount"],
                    "approved_by": request.user["email"],
                    "chore_ids": submission["completed_chore_ids"]  # Only the submitted chores
                }
            }
        }
        
        # Mark goal as completed if target is reached
        if new_saved >= goal_amount:
            update_data["$set"]["status"] = "completed"
            update_data["$set"]["completed_at"] = datetime.utcnow()
        
        goals_col.update_one(
            {"_id": ObjectId(submission["goal_id"])},
            update_data
        )
        
        # Archive ONLY the submitted chores
        submitted_chore_ids = submission.get("completed_chore_ids", [])
        archived_count = 0
        for chore_id in submitted_chore_ids:
            result = chores_col.update_one(
                {"_id": ObjectId(chore_id), "status": "pending_approval"},  # Only if pending
                {
                    "$set": {
                        "status": "archived",
                        "archived_at": datetime.utcnow(),
                        "approved_by": request.user["email"],
                        "is_active": False
                    }
                }
            )
            if result.modified_count > 0:
                archived_count += 1
        
        # Check if there are more chores available for this kid
        remaining_chores = chores_col.count_documents({
            "kid_username": goal['kid_username'],
            "status": "Assigned",
            "is_active": {"$ne": False}
        })
        
        # Delete the notification (it's been processed)
        notifications_col.delete_one({"_id": ObjectId(submission_id)})
        
        # Create a success notification for the child with more info
        child_notification = {
            "type": "progress_approved",
            "title": "Progress Approved! 🎉",
            "message": f"Your parents approved your progress! ${submission['earned_amount']:.2f} has been added to your savings.",
            "goal_id": submission["goal_id"],
            "earned_amount": submission["earned_amount"],
            "archived_chores_count": archived_count,
            "can_select_new_chores": remaining_chores > 0,
            "status": "success",
            "read": False,
            "created_at": datetime.utcnow(),
            "recipient_email": f"{goal['kid_username']}@kids.aidiy"
        }
        notifications_col.insert_one(child_notification)
        
        # If goal is completed, create notifications for both parent and child
        if goal_completed:
            # Notification for parent
            parent_completion_notification = {
                "type": "goal_completed",
                "title": f"{goal['kid_name']} completed their goal! 🎉",
                "message": f"Your child has successfully saved ${goal_amount:.2f} for {goal['title']}",
                "goal_id": str(goal["_id"]),
                "kid_name": goal['kid_name'],
                "kid_avatar": goal['kid_avatar'],
                "goal_title": goal['title'],
                "goal_amount": goal_amount,
                "status": "success",
                "read": False,
                "created_at": datetime.utcnow(),
                "recipient_email": request.user["email"]
            }
            notifications_col.insert_one(parent_completion_notification)
            
            # Additional notification for child about goal completion
            child_completion_notification = {
                "type": "goal_completed",
                "title": "🎊 GOAL ACHIEVED! 🎊",
                "message": f"Congratulations! You've saved ${goal_amount:.2f} for {goal['title']}!",
                "goal_id": str(goal["_id"]),
                "goal_title": goal['title'],
                "goal_amount": goal_amount,
                "status": "success",
                "read": False,
                "created_at": datetime.utcnow(),
                "recipient_email": f"{goal['kid_username']}@kids.aidiy"
            }
            notifications_col.insert_one(child_completion_notification)
        
        return jsonify(
            success=True, 
            message="Progress approved successfully!",
            new_saved=new_saved,
            new_progress=new_progress,
            goal_completed=goal_completed
        ), 200
        
    except Exception as e:
        print(f"[Approve Progress Error] {e}")
        return jsonify(error=str(e)), 500


@app.route("/api/progress/<submission_id>/decline", methods=["POST"])
@auth_required
def decline_progress_submission(submission_id):
    """Decline child's progress submission and reassign ONLY the submitted chores"""
    try:
        # Find the progress submission notification
        submission = notifications_col.find_one(
            {"_id": ObjectId(submission_id), "type": "progress_submission"}
        )
        if not submission:
            return jsonify(error="Submission not found"), 404

        # Verify the user is the parent
        if submission["recipient_email"] != request.user["email"]:
            return jsonify(error="Unauthorized"), 403

        # Get the specific chore IDs that were submitted
        submitted_chore_ids = submission.get("completed_chore_ids", [])
        
        # Reassign ONLY the submitted chores back to "Assigned" status
        reassigned_count = 0
        for chore_id in submitted_chore_ids:
            result = chores_col.update_one(
                {"_id": ObjectId(chore_id), "status": "pending_approval"},
                {
                    "$set": {
                        "status": "Assigned",
                        "updated_at": datetime.utcnow(),
                        "declined_at": datetime.utcnow(),
                        "declined_by": request.user["email"]
                    },
                    "$unset": {
                        "submitted_at": ""
                    }
                }
            )
            if result.modified_count > 0:
                reassigned_count += 1
        
        # Get the goal to find kid's username AND goal title
        goal = goals_col.find_one({"_id": ObjectId(submission["goal_id"])})
        
        if goal:
            # Get details of reassigned chores for the notification
            reassigned_chores = []
            for chore_id in submitted_chore_ids:
                chore = chores_col.find_one({"_id": ObjectId(chore_id)})
                if chore and chore.get("status") == "Assigned":
                    reassigned_chores.append({
                        "id": str(chore["_id"]),
                        "title": chore.get("title", "")
                    })
            
            # Create a notification for the child with specific chore details
            child_notification = {
                "type": "progress_declined",
                "title": "Try Again! 💪",
                "message": f"Your parents want you to redo {len(reassigned_chores)} chore(s). They're ready for another try!",
                "goal_id": submission["goal_id"],
                "goal_title": goal.get("title", ""),  # ← ADD THIS LINE
                "reassigned_chore_ids": submitted_chore_ids,
                "reassigned_chores": reassigned_chores,
                "status": "declined",
                "read": False,
                "created_at": datetime.utcnow(),
                "recipient_email": f"{goal['kid_username']}@kids.aidiy"
            }
            notifications_col.insert_one(child_notification)
        
        # Delete the progress submission notification
        notifications_col.delete_one({"_id": ObjectId(submission_id)})
        
        return jsonify(
            success=True, 
            message=f"Progress declined and {reassigned_count} chore(s) reassigned",
            kid_id=goal.get("kid_username"),  # Add this for frontend
            goal_id=submission["goal_id"]     # Add this for frontend
        ), 200
        
    except Exception as e:
        print(f"[Decline Progress Error] {e}")
        return jsonify(error=str(e)), 500

# ---------- Notifications ---------- #
@app.route("/api/notifications")
@auth_required
def get_notifications():
    """
    Return the 20 most-recent notifications for the logged-in user
    (parent), plus a count of how many are unread.
    """
    user_email = request.user["email"]
    try:
        cursor = (
            notifications_col
            .find({"recipient_email": user_email})
            .sort("created_at", DESCENDING)
            .limit(20)
        )
        notifications = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            # created_at → ISO 8601 string
            if isinstance(doc.get("created_at"), datetime):
                doc["created_at"] = doc["created_at"].isoformat()
            else:
                doc["created_at"] = str(doc.get("created_at"))
            
            # Fix: Use consistent field names
            # Set read status (default to False if not present)
            doc.setdefault("read", False)
            # Set type
            doc.setdefault("type", "notification")
            
            notifications.append(doc)
        
        # Fix: Count unread notifications consistently
        unread_count = notifications_col.count_documents({
            "recipient_email": user_email,
            "read": {"$ne": True}  # Count notifications where read is not True
        })
        
        return jsonify(
            success=True,
            notifications=notifications,
            unread_count=unread_count
        ), 200
    except Exception as e:
        print("[Notifications Error]", e)
        return jsonify(
            success=False,
            error="Failed to fetch notifications, please try again later."
        ), 500

@app.route("/api/notifications/mark-read", methods=["POST"])
@auth_required
def mark_notifications_read():
    """Mark all notifications as read for the current user"""
    try:
        result = notifications_col.update_many(
            {"recipient_email": request.user["email"]},
            {"$set": {"read": True}}
        )
        return jsonify(
            success=True,
            message=f"Marked {result.modified_count} notifications as read"
        ), 200
    except Exception as e:
        print("[Mark Read Error]", e)
        return jsonify(
            success=False,
            error="Failed to mark notifications as read"
        ), 500

@app.route("/api/notifications/<notification_id>/mark-read", methods=["POST"])
@auth_required
def mark_single_notification_read(notification_id):
    """Mark a single notification as read"""
    try:
        from bson import ObjectId
        result = notifications_col.update_one(
            {
                "_id": ObjectId(notification_id),
                "recipient_email": request.user["email"]
            },
            {"$set": {"read": True}}
        )
        
        if result.matched_count == 0:
            return jsonify(
                success=False,
                error="Notification not found"
            ), 404
            
        return jsonify(
            success=True,
            message="Notification marked as read"
        ), 200
    except Exception as e:
        print("[Mark Single Read Error]", e)
        return jsonify(
            success=False,
            error="Failed to mark notification as read"
        ), 500
    
@app.route("/api/notifications/unread-count")
@auth_required
def get_unread_count():
    user_email = request.user["email"]
    try:
        count = notifications_col.count_documents({
            "recipient_email": user_email,
            "read": {"$ne": True}
        })
        return jsonify(success=True, count=count), 200
    except Exception as e:
        print("[Unread Count Error]", e)
        return jsonify(success=False, error="Could not get unread count"), 500

@app.route("/api/chores/assign-to-goal", methods=["POST"])
@auth_required
def assign_chores_to_goal():
    """
    Assign selected chores to a specific goal for a kid.
    """
    try:
        data = request.get_json()
        goal_id = data.get("goalId")
        chore_ids = data.get("choreIds", [])
        
        if not goal_id or not chore_ids:
            return jsonify(error="Missing goalId or choreIds"), 400
        
        # Verify the goal belongs to this kid
        goal = goals_col.find_one({"_id": ObjectId(goal_id)})
        if not goal:
            return jsonify(error="Goal not found"), 404
            
        # Update each chore to be assigned to this goal
        for chore_id in chore_ids:
            chores_col.update_one(
                {"_id": ObjectId(chore_id)},
                {
                    "$set": {
                        "assigned_goal_id": goal_id,
                        "status": "Assigned",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        # Update the goal to track assigned chores
        goals_col.update_one(
            {"_id": ObjectId(goal_id)},
            {
                "$set": {
                    "assigned_chore_ids": chore_ids,
                    "has_launched_mission": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify(success=True, message="Chores assigned to goal"), 200
        
    except Exception as e:
        print(f"[Assign Chores Error] {e}")
        return jsonify(error=str(e)), 500

@app.route("/api/goals/<goal_id>/chores", methods=["GET"])
@auth_required
def get_goal_chores(goal_id):
    """
    Get chores assigned to a specific goal (excluding archived/approved ones)
    """
    try:
        # Find chores assigned to this goal that are NOT archived or pending approval
        chores = list(chores_col.find({
            "assigned_goal_id": goal_id,
            "status": {"$nin": ["archived", "pending_approval"]}  # Exclude these statuses
        }))
        
        for chore in chores:
            chore["id"] = str(chore.pop("_id"))
            # Include the status field
            chore["status"] = chore.get("status", "Assigned")
            if "created_at" in chore and hasattr(chore["created_at"], "isoformat"):
                chore["created_at"] = chore["created_at"].isoformat()
            if "updated_at" in chore and hasattr(chore["updated_at"], "isoformat"):
                chore["updated_at"] = chore["updated_at"].isoformat()
                
        return jsonify(success=True, chores=chores), 200
        
    except Exception as e:
        print(f"[Get Goal Chores Error] {e}")
        return jsonify(error=str(e)), 500

# ────────────── Run ────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5500))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEV_MODE", "False") == "True"
    
    print(f"Starting AIDIY Flask Server on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
