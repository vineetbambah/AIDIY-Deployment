# AIDIY - AI-Powered Financial Literacy Platform for Children

AIDIY is an innovative educational platform that combines artificial intelligence with gamification to teach children essential financial literacy skills. The platform provides personalized learning experiences, interactive challenges, and real-world money management practice in a safe, engaging environment.

## Features

### For Parents

- **Comprehensive Dashboard**: Monitor children's progress, assign tasks, and manage rewards
- **AI-Powered Assistant**: Get personalized advice and insights about your child's financial education
- **Voice & Chat Interface**: Interact with AI through text or voice commands
- **Task Management**: Create and assign age-appropriate financial tasks and chores
- **Progress Tracking**: View detailed analytics of your child's learning journey
- **Multi-Child Support**: Manage multiple children's profiles from one account
- **Assessment Tools**: Evaluate your child's current financial knowledge level

### For Children

- **Gamified Learning**: Earn rewards and achievements while learning about money
- **Interactive Challenges**: Complete fun, educational tasks to build financial skills
- **Virtual Piggy Bank**: Practice saving and managing money in a safe environment
- **Age-Appropriate Content**: Customized learning paths based on age and skill level

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB (local or Atlas)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/AIDIY-Dev.git
cd AIDIY-Dev
```

2. **Backend Setup**

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your configuration
```

3. **Frontend Setup**

```bash
cd client
npm install
```

4. **Environment Configuration**

Create a `.env` file in the root directory with:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration (optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Development Mode
DEV_MODE=true  # Skip email verification in development
```

### Running the Application

1. **Start the Backend**

```bash
# From the root directory with virtual environment activated
.venv/bin/python app.py
```

The backend will run on `http://localhost:5500`

2. **Start the Frontend**

```bash
# In a new terminal, from the client directory
npm start
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
AIDIY-Dev/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── .env                  # Environment variables
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignUpPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── ParentSetupPage.jsx
│   │   │   ├── KidSelectionPage.jsx
│   │   │   ├── KidAssessmentPage.jsx
│   │   │   ├── AssessmentQuiz.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   └── ...
│   │   ├── store/        # Redux store
│   │   └── App.js        # Main app component
│   └── package.json
└── README.md
```

## Key Features Implementation

### Authentication System

- Email/password registration with OTP verification
- Google OAuth integration
- JWT-based session management
- Automatic login after registration

### User Profiles

- Parent profile setup with role selection (Mom/Dad)
- Support for two-parent households
- Children profile management
- Avatar customization

### Assessment System

- 6-question assessment quiz for evaluating children's financial knowledge
- Categories include:
  - Money recognition and counting
  - Saving habits
  - Understanding earning
  - Wants vs needs
  - Purchasing decisions
  - Financial responsibility

### AI Integration

- ChatGPT-4o integration for personalized advice
- Voice-to-text functionality
- Context-aware responses based on child's assessment results
- Image upload support for visual learning

### User Interface

- Modern, responsive design
- Animated AI avatar assistant
- Progress tracking visualizations
- Intuitive navigation flow
- Dark mode support in assessment pages

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/verify-otp` - OTP verification
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/children` - Get user's children
- `POST /api/users/children` - Add a child

### AI Features

- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/speech-to-text` - Convert speech to text

## Technologies Used

### Backend

- Flask (Python web framework)
- MongoDB (Database)
- PyMongo (MongoDB driver)
- JWT (Authentication)
- OpenAI API (AI features)
- Flask-CORS (Cross-origin support)

### Frontend

- React 18
- Redux Toolkit (State management)
- React Router (Navigation)
- Tailwind CSS (Styling)
- Axios (API calls)

## Security Features

- Password hashing with bcrypt
- JWT token expiration
- CORS configuration
- Environment variable protection
- Input validation and sanitization

## Development Notes

- **Development Mode**: Set `DEV_MODE=true` in `.env` to skip email verification
- **Test Account**: Use `test@example.com` / `test123` for testing
- **MongoDB**: Ensure MongoDB is running before starting the backend
- **OpenAI API**: Required for AI chat and voice features

## Recent Updates

- Added comprehensive parent dashboard with AI integration
- Implemented child assessment quiz with 6 financial literacy questions
- Created animated AI avatar component
- Added voice recording and speech-to-text functionality
- Improved user onboarding flow
- Enhanced profile management with spouse/partner support
- Implemented task and chore management system
- Added progress tracking and analytics

**Note**: This is a development version. For production deployment, additional security measures and optimizations are recommended.
