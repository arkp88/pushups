#!/usr/bin/env python3
"""
Test script for TSV upload error handling and image URL handling
"""

import requests
import json
import os

API_URL = "http://localhost:5001"

# You'll need a valid JWT token for testing
# Get this from your browser's localStorage after logging in
# For now, we'll print instructions
print("=" * 60)
print("TSV Upload Testing Script")
print("=" * 60)
print("\nTo run these tests, you need a valid JWT token.")
print("Steps:")
print("1. Open http://localhost:3000 in browser")
print("2. Log in to the app")
print("3. Open browser console (F12)")
print("4. Type: localStorage.getItem('supabase.auth.token')")
print("5. Copy the 'access_token' value")
print("6. Set TOKEN variable in this script\n")

# Placeholder for token
TOKEN = os.environ.get('JWT_TOKEN', '')

if not TOKEN:
    print("❌ JWT_TOKEN environment variable not set")
    print("Run: export JWT_TOKEN='your-token-here'")
    print("\nAlternatively, testing the parsing logic directly...\n")

    # Test the parsing logic directly without auth
    import sys
    sys.path.insert(0, '/Users/raouf/Downloads/quiz-app/backend')

    # Import the parsing function
    try:
        from app import parse_and_save_set
        print("✅ Successfully imported parse_and_save_set")
        print("\nNote: Direct function testing requires database access.")
        print("For full E2E testing, please provide JWT_TOKEN.\n")
    except Exception as e:
        print(f"❌ Could not import: {e}")

    exit(0)

headers = {
    'Authorization': f'Bearer {TOKEN}'
}

test_files = [
    ('test-valid.tsv', 'Valid TSV', True),
    ('test-missing-columns.tsv', 'Missing required columns', False),
    ('test-malformed.tsv', 'Malformed TSV with embedded tabs', False),
    ('test-http-images.tsv', 'TSV with HTTP image URLs', True),
]

print("\n" + "=" * 60)
print("Running Upload Tests")
print("=" * 60 + "\n")

for filename, description, should_succeed in test_files:
    print(f"\n📄 Testing: {description}")
    print(f"   File: {filename}")

    filepath = f'/Users/raouf/Downloads/quiz-app/{filename}'

    if not os.path.exists(filepath):
        print(f"   ❌ File not found: {filepath}")
        continue

    try:
        with open(filepath, 'rb') as f:
            files = {'file': (filename, f, 'text/tab-separated-values')}
            data = {
                'set_name': f'Test - {description}',
                'tags': 'test'
            }

            response = requests.post(
                f'{API_URL}/api/upload-tsv',
                files=files,
                data=data,
                headers=headers
            )

            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result.get('questions_imported', 0)} questions imported")
                if not should_succeed:
                    print(f"   ⚠️  WARNING: Expected this to fail but it succeeded!")
            else:
                result = response.json()
                error = result.get('error', 'Unknown error')
                print(f"   ❌ Error: {error}")
                if should_succeed:
                    print(f"   ⚠️  WARNING: Expected this to succeed but it failed!")
                else:
                    # Check if error message includes line number
                    if 'line' in error.lower():
                        print(f"   ✅ Error message includes line number context")
                    else:
                        print(f"   ⚠️  Error message missing line number context")

    except Exception as e:
        print(f"   ❌ Exception: {e}")

print("\n" + "=" * 60)
print("Testing Complete")
print("=" * 60)
