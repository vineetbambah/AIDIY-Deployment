# AIDIY Client

A modern React application for AI learning platform designed for children with parental monitoring.

## Features

- **Parent Login**: Google OAuth integration and email/password authentication
- **Kid Login**: Simple 4-digit code authentication system
- **Profile Management**: Manage parent and child profiles
- **OTP Verification**: Email-based verification system
- **Password Reset**: Forgot password functionality
- **Modern UI**: Built with Twind (Tailwind-in-JS) for styling

## Technology Stack

- **React 18**: Frontend framework
- **Redux Toolkit**: State management
- **React Router**: Navigation
- **Twind**: Tailwind-in-JS styling solution
- **Google Identity Services**: OAuth authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── HomePage.jsx     # Landing page
│   ├── LoginPage.jsx    # Parent/Kid login
│   ├── ProfilePage.jsx  # Profile management
│   ├── OTPVerification.jsx
│   └── ForgotPassword.jsx
├── store/              # Redux store and slices
│   ├── store.js
│   └── authSlice.js
├── twind.config.js     # Twind configuration
└── index.js           # App entry point
```

## Styling

This project uses **Twind** instead of traditional CSS files. Twind provides:
- Tailwind CSS utilities as JavaScript
- Better performance with atomic CSS
- Type-safe styling
- No build step required for CSS

### Color Scheme

- Primary Turquoise: `#40E0D0`
- Accent Pink: `#FFB6C1`
- Accent Purple: `#6B46C1`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## Recent Updates

- ✅ Converted all pages from Chinese to English
- ✅ Replaced all CSS files with Twind styling
- ✅ Implemented modern, responsive design
- ✅ Added Google OAuth integration
- ✅ Created comprehensive profile management system
- ✅ Fixed all linting warnings and compilation errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
