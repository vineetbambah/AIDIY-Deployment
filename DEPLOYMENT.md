# AIDIY Deployment Guide

## 🚀 Deployment Architecture

- **Frontend**: Netlify (Static Hosting)
- **Backend**: Railway (Python Flask)
- **Database**: MongoDB Atlas
- **Domain**: aidiy.ca (Squarespace)

## 📋 Deployment Steps

### 1. MongoDB Atlas Setup
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (select free tier M0)
4. Create a database user
5. Get the connection string

### 2. Railway Backend Deployment
1. Visit [Railway.app](https://railway.app)
2. Login with GitHub
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Set environment variables:
   - `MONGO_URI`: MongoDB connection string
   - `FLASK_SECRET_KEY`: Flask secret key
   - `JWT_SECRET`: JWT secret key
   - `OPENAI_API_KEY`: Your OpenAI API Key
   - `DEV_MODE`: False
   - `MAIL_USERNAME`: Email username
   - `MAIL_PASSWORD`: Email password

### 3. Vercel Frontend Deployment
1. Visit [Vercel.com](https://vercel.com)
2. Login with GitHub
3. Import this repository
4. Set build settings:
   - Framework Preset: Create React App
   - Root Directory: client
5. Set environment variables:
   - `REACT_APP_API_URL`: Railway backend URL

### 4. Domain Configuration
1. Get the backend URL from Railway
2. Get the frontend URL from Vercel
3. In Squarespace DNS settings:
   - Add CNAME record: www -> vercel frontend URL
   - Add A record: @ -> vercel frontend IP

## 🔧 Environment Variables

### Backend (Railway)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aidiy_app
FLASK_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
OPENAI_API_KEY=sk-your-openai-key
DEV_MODE=False
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend (Vercel)
```
REACT_APP_API_URL=https://your-app.railway.app
```

## 🌐 Access URLs

- **Production Website**: https://aidiy.ca
- **Backend API**: https://your-app.railway.app
- **Admin Dashboard**: Vercel/Railway dashboard 