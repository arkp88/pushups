"""
Application Configuration
Centralized configuration for the Quiz App backend
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Flask Configuration
SECRET_KEY = os.getenv('JWT_SECRET_KEY')
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
MAX_CONTENT_PATH = None  # No path-specific limits

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')

# Authentication Configuration
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

# Google Drive Configuration
GOOGLE_DRIVE_API_KEY = os.getenv('GOOGLE_DRIVE_API_KEY')

# CORS Configuration
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
frontend_url = os.getenv('FRONTEND_URL', '').strip()
if frontend_url:
    # Remove trailing slash if present
    frontend_url = frontend_url.rstrip('/')
    CORS_ALLOWED_ORIGINS.append(frontend_url)

# Connection Pool Configuration
DB_POOL_MIN_CONN = 1
DB_POOL_MAX_CONN = 10

# Upload Configuration
ALLOWED_MIME_TYPES = [
    'text/tab-separated-values',
    'text/plain',
    'application/octet-stream',  # Some browsers use this for .tsv files
    'text/tsv'
]

# Parsing Configuration
BATCH_INSERT_SIZE = 100
TIMEOUT_THRESHOLD_SECONDS = 20  # Partial upload detection threshold
PARTIAL_UPLOAD_MISSING_PERCENTAGE = 0.2  # 20% missing triggers partial flag

# Drive Integration Configuration
MAX_DRIVE_API_CALLS = 100  # Limit to prevent infinite recursion
MAX_RECURSIVE_IMPORT_FILES = 50  # Hard limit for batch imports

# Validate required environment variables
def validate_config():
    """Validate that all required environment variables are set"""
    required_vars = {
        'DATABASE_URL': DATABASE_URL,
        'SUPABASE_JWT_SECRET': SUPABASE_JWT_SECRET,
        'JWT_SECRET_KEY': SECRET_KEY,
    }

    for var_name, var_value in required_vars.items():
        if not var_value:
            raise ValueError(
                f"❌ {var_name} is missing!\n"
                f"💡 Check your .env file and ensure {var_name} is set\n"
                f"📄 See .env.example for required variables"
            )

# Run validation on import
validate_config()
