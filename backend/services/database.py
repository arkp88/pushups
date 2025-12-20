"""Database connection management"""
import logging
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor

from config import DATABASE_URL, DB_POOL_MIN_CONN, DB_POOL_MAX_CONN

logger = logging.getLogger(__name__)

# Global connection pool
connection_pool = None

try:
    connection_pool = psycopg2.pool.ThreadedConnectionPool(
        minconn=DB_POOL_MIN_CONN,
        maxconn=DB_POOL_MAX_CONN,
        dsn=DATABASE_URL
    )
    logger.info("Database connection pool created successfully")
except Exception as e:
    logger.error(f"Failed to create connection pool: {str(e)}")
    raise


def get_db():
    """
    Get database connection from pool.

    Returns:
        connection: PostgreSQL connection with RealDictCursor factory
    """
    try:
        conn = connection_pool.getconn()
        # Set cursor factory for this connection
        conn.cursor_factory = RealDictCursor
        return conn
    except Exception as e:
        logger.error(f"Failed to get database connection: {str(e)}")
        raise


def return_db(conn):
    """
    Return database connection to pool.

    Performs rollback before returning to ensure clean state.

    Args:
        conn: Database connection to return
    """
    if conn:
        try:
            # Rollback any pending transaction before returning
            if not conn.closed:
                conn.rollback()
            connection_pool.putconn(conn)
        except Exception as e:
            logger.error(f"Failed to return connection to pool: {str(e)}")


def cleanup_connection_pool():
    """Close connection pool on shutdown to prevent connection leaks"""
    global connection_pool
    if connection_pool:
        try:
            connection_pool.closeall()
            logger.info("Database connection pool closed successfully")
        except Exception as e:
            logger.error(f"Error closing connection pool: {str(e)}")
