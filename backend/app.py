"""
Quiz App Backend - Main Application

Minimal Flask application that registers all route blueprints.
All business logic has been extracted to separate modules for better organization.
"""
import os
import logging
import atexit
import signal
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from config import SECRET_KEY, MAX_CONTENT_LENGTH, CORS_ALLOWED_ORIGINS
from services.database import connection_pool

# Import route blueprints
from routes.health import health_bp, is_server_warming_up
from routes.public import public_bp
from routes.drive import drive_bp
from routes.sets import sets_bp
from routes.questions import questions_bp
from routes.stats import stats_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['MAX_CONTENT_PATH'] = None
# CORS configuration - whitelist specific origins
logger.info(f"CORS allowed origins: {CORS_ALLOWED_ORIGINS}")

# Expose custom headers to frontend (needed for X-Server-Warming header)
CORS(app, origins=CORS_ALLOWED_ORIGINS, expose_headers=['X-Server-Warming'])


# Add middleware to include warming header in all responses
@app.after_request
def add_warming_header(response):
    """
    Add X-Server-Warming header to all responses during the first 60 seconds
    after server start. This helps the frontend detect genuine cold starts
    on Render's free tier.
    """
    if is_server_warming_up():
        response.headers['X-Server-Warming'] = 'true'
    return response


# Rate limiting configuration
def get_rate_limit_key():
    """
    Get rate limit key - use user ID when authenticated, otherwise IP address.
    """
    from flask import request
    # Try to get user ID from request context (set by @token_required decorator)
    if hasattr(request, 'current_user') and request.current_user:
        return f"user_{request.current_user['id']}"
    # Fallback to IP address for non-authenticated endpoints
    return get_remote_address()


limiter = Limiter(
    app=app,
    key_func=get_rate_limit_key,
    default_limits=[],  # No default limits - apply per-endpoint instead
    storage_uri="memory://"  # Use in-memory storage (simple, no Redis needed)
)

# Note: Rate limits are applied via decorators on individual routes in blueprint modules


# Error handler for file too large
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle files that exceed the maximum size limit."""
    return jsonify({
        'error': 'File too large',
        'message': 'The uploaded file exceeds the maximum size limit of 16MB. Please upload a smaller file.'
    }), 413


# Register blueprints
app.register_blueprint(health_bp)
app.register_blueprint(public_bp)
app.register_blueprint(drive_bp)
app.register_blueprint(sets_bp)
app.register_blueprint(questions_bp)
app.register_blueprint(stats_bp)

# Apply rate limiting to specific routes after registration
limiter.limit("100 per hour")(app.view_functions['sets.upload_tsv'])
limiter.limit("100 per hour")(app.view_functions['drive.import_drive_file'])

logger.info("All route blueprints registered successfully")


# Cleanup handler
def cleanup_connection_pool():
    """Close connection pool on shutdown to prevent connection leaks."""
    if connection_pool:
        try:
            connection_pool.closeall()
            logger.info("Database connection pool closed successfully")
        except Exception as e:
            logger.error(f"Error closing connection pool: {str(e)}")


# Register cleanup handlers
atexit.register(cleanup_connection_pool)


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    cleanup_connection_pool()
    exit(0)


signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
