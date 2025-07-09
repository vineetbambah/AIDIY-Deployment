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
    "https://aidiy.ca",       # Production domain
    "https://www.aidiy.ca",   # Production www subdomain
    "https://aidiy-deployment-production.up.railway.app",  # Railway backend
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
        ai_available=openai_client is not None
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
    if datetime.now(timezone.utc) > rec["expires_at"]:
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
        return jsonify(error="No token"), 400
    try:
        info = id_token.verify_oauth2_token(tok, google_requests.Request(), CLIENT_ID)
    except Exception as e:
        print(f"[Google Auth Error] {type(e).__name__}: {str(e)}")
        # Check if it's a network-related error
        if "network" in str(e).lower() or "connection" in str(e).lower() or "timeout" in str(e).lower():
            return jsonify(error="Network error: Unable to verify token with Google"), 503
        else:
            return jsonify(error=f"Token verification failed: {str(e)}"), 400

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
            "isVerified": DEV_MODE,  # Auto-verify in dev mode
            "password": None,
            "isProfileComplete": False,
            "hasCompletedAssessment": False,
        }
        users_col.insert_one(user)

    # Skip OTP verification in dev mode
    if not user.get("isVerified") and not DEV_MODE:
        create_or_replace_otp(email, "verify")
        return (
            jsonify(success=True, otpRequired=True, message="OTP sent to email"),
            200,
        )

    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

@app.route("/auth/google/verify-otp", methods=["POST"])
def google_verify_otp():
    d = request.get_json() or {}
    email, otp_input = d.get("email"), d.get("otp")

    rec = otps_col.find_one({"email": email, "purpose": "verify"})
    if not rec:
        return jsonify(error="Invalid OTP"), 400
    if datetime.now(timezone.utc) > rec["expires_at"]:
        return jsonify(error="OTP expired"), 400
    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Too many attempts"), 403
    if otp_input != rec["otp"]:
        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    users_col.update_one({"email": email}, {"$set": {"isVerified": True}})
    otps_col.delete_one({"email": email})

    user = users_col.find_one({"email": email})
    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

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
        }
    )
    return jsonify(
        success=True,
        user={
            "username": username,
            "name": child.get("nickName") or child["firstName"],
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
    return jsonify(success=True, user=user)

# ---------- Update user profile ---------- #
@app.route("/api/users/profile", methods=["PUT"])
@auth_required
def update_profile():
    d = request.get_json() or {}
    
    # Allowed fields to update
    allowed_fields = ["firstName", "lastName", "phoneNumber", "birthDate", "parentRole", "spouse", "parents"]
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

# Initialize OpenAI client safely
def get_openai_client():
    if OpenAI is None:
        print("[OpenAI] OpenAI package not available, AI features will be disabled")
        return None
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[OpenAI] No API key provided, AI features will be disabled")
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception as e:
        print(f"[OpenAI] Failed to initialize client: {e}")
        print("[OpenAI] AI features will be disabled")
        return None

# Get OpenAI client instance
openai_client = None
try:
    openai_client = get_openai_client()
    if openai_client:
        print("[OpenAI] Client initialized successfully")
    else:
        print("[OpenAI] Running without AI features")
except Exception as e:
    print(f"[OpenAI] Error during initialization: {e}")
    print("[OpenAI] Running without AI features")

@app.route("/api/ai/chat", methods=["POST"])
@auth_required
def ai_chat():
    try:
        # Check if OpenAI client is available
        if not openai_client:
            return jsonify(error="AI service is not available"), 503
        
        d = request.get_json() or {}
        message = d.get("message", "")
        image_base64 = d.get("image")
        
        if not message and not image_base64:
            return jsonify(error="Message or image required"), 400
        
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": "You are a helpful financial coach for kids and parents. Provide age-appropriate advice and tasks about money management, saving, financial literacy and chores."},
            {"role": "user", "content": message}
        ]
        
        # If image is provided, add it to the message
        if image_base64:
            messages[-1]["content"] = [
                {"type": "text", "text": message},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]
        
        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4o" if image_base64 else "gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        return jsonify(success=True, response=ai_response)
        
    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return jsonify(error="Failed to process AI request"), 500

@app.route("/api/ai/speech-to-text", methods=["POST"])
@auth_required
def speech_to_text():
    try:
        # Check if OpenAI client is available
        if not openai_client:
            return jsonify(error="AI service is not available"), 503
        
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
            
            transcript = openai_client.audio.transcriptions.create(
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

# ---------- Goals management ---------- #

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
            "created_at": datetime.now(timezone.utc),
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
            "created_at": datetime.now(timezone.utc)
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
                    "approved_at": datetime.now(timezone.utc),
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
                    "declined_at": datetime.now(timezone.utc),
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

@app.route("/api/notifications")
@auth_required
def get_notifications():
    notifications = list(
        notifications_col.find(
            {"recipient_email": request.user["email"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(20)
    )
    
    # Convert datetime to ISO format
    for notif in notifications:
        if "created_at" in notif:
            notif["created_at"] = notif["created_at"].isoformat()
    
    unread_count = notifications_col.count_documents({
        "recipient_email": request.user["email"],
        "status": "pending"
    })
    
    return jsonify(success=True, notifications=notifications, unread_count=unread_count)

@app.route("/api/notifications/mark-read", methods=["POST"])
@auth_required
def mark_notifications_read():
    notifications_col.update_many(
        {"recipient_email": request.user["email"]},
        {"$set": {"read": True}}
    )
    return jsonify(success=True)

# ────────────── Run ────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5500))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEV_MODE", "False") == "True"
    
    print(f"Starting AIDIY Flask Server on {host}:{port}")
    app.run(host=host, port=port, debug=debug)
