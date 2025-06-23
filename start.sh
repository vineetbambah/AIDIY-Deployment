#!/bin/bash

echo "🚀 Starting AIDIY Full Stack Application..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start Flask backend
echo "📡 Starting Flask backend on port 5500..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "🌐 Starting React frontend on port 3000..."
cd client && npm start &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:5500/api"
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait 