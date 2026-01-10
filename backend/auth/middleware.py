"""
Authentication Middleware

Handles JWT token verification and user authentication using Supabase.
"""
import logging
import jwt
import psycopg2
from functools import wraps
from flask import request, jsonify

from config import SUPABASE_JWT_SECRET
from services.database import get_db, return_db

logger = logging.getLogger(__name__)


def verify_supabase_token(token):
    """
    Verify Supabase JWT token.

    Args:
        token (str): JWT token to verify

    Returns:
        dict: Token payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            audience='authenticated'
        )
        return payload
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """
    Decorator to require JWT authentication for routes.

    Validates the token, extracts user info, and creates/fetches user from database.
    Sets request.current_user with the authenticated user's data.

    Usage:
        @app.route('/api/protected')
        @token_required
        def protected_route():
            user = request.current_user
            return jsonify({'user_id': user['id']})

    Returns:
        function: Decorated function that requires authentication
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            logger.warning("Missing authorization header")
            return jsonify({
                'error': 'Authentication required',
                'message': 'Token is missing'
            }), 401

        conn = None
        try:
            # Strip 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]

            # Verify token
            payload = verify_supabase_token(token)
            if not payload:
                logger.warning("Invalid token provided")
                return jsonify({
                    'error': 'Invalid token',
                    'message': 'Token verification failed'
                }), 401

            # Extract user info from token
            supabase_user_id = payload.get('sub')
            email = payload.get('email')

            if not supabase_user_id or not email:
                logger.error("Token missing required fields")
                return jsonify({'error': 'Invalid token structure'}), 401

            # Get or create user in database
            conn = get_db()
            cur = conn.cursor()

            cur.execute(
                'SELECT * FROM users WHERE supabase_user_id = %s',
                (supabase_user_id,)
            )
            user = cur.fetchone()

            if not user:
                # Create new user
                username = email.split('@')[0]
                cur.execute(
                    'INSERT INTO users (supabase_user_id, email, username) VALUES (%s, %s, %s) RETURNING *',
                    (supabase_user_id, email, username)
                )
                user = cur.fetchone()
                conn.commit()
                logger.info(f"Created new user: {username}")

            cur.close()

            # Attach user to request object
            request.current_user = user

        except jwt.InvalidTokenError as e:
            logger.error(f"JWT validation error: {str(e)}")
            return jsonify({
                'error': 'Invalid token',
                'message': 'Token verification failed'
            }), 401
        except psycopg2.Error as e:
            logger.error(f"Database error in auth: {str(e)}")
            if conn:
                conn.rollback()
            return jsonify({
                'error': 'Database error',
                'message': 'Failed to authenticate user'
            }), 500
        except Exception as e:
            logger.error(f"Unexpected auth error: {str(e)}")
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401
        finally:
            if conn:
                return_db(conn)

        return f(*args, **kwargs)

    return decorated
