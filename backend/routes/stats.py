"""
Statistics and Missed Questions Routes

Handles user statistics, streak tracking, and missed questions management.
"""
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify

from auth import token_required
from services.database import get_db, return_db

logger = logging.getLogger(__name__)

stats_bp = Blueprint('stats', __name__, url_prefix='/api')


@stats_bp.route('/stats', methods=['GET'])
@token_required
def get_stats():
    """
    Get comprehensive user statistics.

    Returns:
        JSON response with:
        - total_questions: Total questions available (from non-deleted sets)
        - attempted: Number of questions attempted
        - correct: Number of questions answered correctly
        - missed: Number of questions marked as missed
        - bookmarks: Number of bookmarked questions
        - accuracy: Percentage of correct answers
        - streak: Current daily practice streak
    """
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Optimized: Single query with CTE to get all stats at once
        cur.execute('''
            WITH active_questions AS (
                SELECT q.id
                FROM questions q
                JOIN question_sets qs ON q.set_id = qs.id
                WHERE qs.is_deleted = false
            )
            SELECT
                COUNT(DISTINCT aq.id) as total_questions,
                COUNT(DISTINCT up.id) FILTER (WHERE up.attempted = true) as attempted,
                COUNT(DISTINCT up.id) FILTER (WHERE up.correct = true) as correct,
                COUNT(DISTINCT mq.id) as missed,
                COUNT(DISTINCT b.id) as bookmarks
            FROM active_questions aq
            LEFT JOIN user_progress up ON aq.id = up.question_id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON aq.id = mq.question_id AND mq.user_id = %s
            LEFT JOIN bookmarks b ON aq.id = b.question_id AND b.user_id = %s
        ''', (request.current_user['id'], request.current_user['id'], request.current_user['id']))

        stats = cur.fetchone()
        total_questions = stats['total_questions']
        attempted = stats['attempted']
        correct = stats['correct']
        missed = stats['missed']
        bookmarks = stats['bookmarks']

        # Calculate daily streak
        cur.execute('''
            SELECT activity_date
            FROM daily_activity
            WHERE user_id = %s
            ORDER BY activity_date DESC
        ''', (request.current_user['id'],))
        activity_dates = [row['activity_date'] for row in cur.fetchall()]

        streak = 0
        if activity_dates:
            current_date = datetime.now().date()
            # Check if user practiced today or yesterday (to keep streak alive)
            if activity_dates[0] == current_date or activity_dates[0] == current_date - timedelta(days=1):
                streak = 1
                expected_date = activity_dates[0] - timedelta(days=1)

                for i in range(1, len(activity_dates)):
                    if activity_dates[i] == expected_date:
                        streak += 1
                        expected_date -= timedelta(days=1)
                    else:
                        break

        if cur:
            cur.close()

        return jsonify({
            'total_questions': total_questions,
            'attempted': attempted,
            'correct': correct,
            'missed': missed,
            'bookmarks': bookmarks,
            'accuracy': round((correct / attempted * 100) if attempted > 0 else 0, 1),
            'streak': streak
        })
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@stats_bp.route('/missed-questions', methods=['GET'])
@token_required
def get_missed_questions():
    """
    Get all questions marked as missed by the current user.

    Returns:
        JSON response with list of missed questions (not yet exported to Anki)
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT q.*, mq.added_at, qs.name as set_name
            FROM missed_questions mq
            JOIN questions q ON mq.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE mq.user_id = %s
            AND mq.exported_to_anki = false
            AND qs.is_deleted = false
            ORDER BY mq.added_at DESC
        ''', (request.current_user['id'],))
        questions = cur.fetchall()
        cur.close()
        return jsonify({'missed_questions': questions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
