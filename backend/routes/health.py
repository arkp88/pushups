"""
Health Check Route

Simple health check endpoint to verify the service is running.
"""
from datetime import datetime
from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

# Track when the server started (set once per process lifetime)
SERVER_START_TIME = datetime.utcnow()


def is_server_warming_up():
    """
    Check if the server is in the warming-up period (first 60 seconds after start).
    This helps detect genuine cold starts on Render's free tier.

    Returns:
        bool: True if server started less than 60 seconds ago
    """
    time_since_start = (datetime.utcnow() - SERVER_START_TIME).total_seconds()
    return time_since_start < 60


@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.

    Returns:
        JSON response with status and timestamp
    """
    response = jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'warming_up': is_server_warming_up()
    })

    # Add custom header if server is warming up
    if is_server_warming_up():
        response.headers['X-Server-Warming'] = 'true'

    return response
