"""
Temporary middleware to simulate backend wake-up delay for testing

Usage:
1. Add this to your backend app.py TEMPORARILY:

   from test_wake_delay import add_wake_delay
   add_wake_delay(app)  # Add after creating app, before routes

2. Restart backend
3. Test the frontend - all requests will be delayed by 10 seconds
4. Remove the import and call when done testing
"""

import time
from flask import request

def add_wake_delay(app):
    """Add 10-second delay to all API requests to simulate wake-up"""

    @app.before_request
    def simulate_wake_delay():
        # Only delay API requests, not static files
        if request.path.startswith('/api/'):
            print(f"⏱️  Simulating 10s wake delay for {request.path}")
            time.sleep(10)

    print("\n" + "="*60)
    print("⚠️  WAKE DELAY TESTING MODE ENABLED")
    print("   All /api/ requests will be delayed by 10 seconds")
    print("   Remove test_wake_delay import when done testing!")
    print("="*60 + "\n")
