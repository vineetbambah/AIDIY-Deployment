# Vercel entry point - imports the main Flask app
import sys
import os

# Add the parent directory to Python path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the main Flask application from app.py
from app import app

# Vercel will automatically handle the WSGI interface
# Just export the Flask app instance 