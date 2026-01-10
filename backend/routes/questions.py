"""
Questions and Progress Routes

Handles fetching questions, tracking user progress, managing missed questions, and bookmarks.
"""
import logging
from flask import Blueprint, request, jsonify

from auth import token_required
from services.database import get_db, return_db

logger = logging.getLogger(__name__)

questions_bp = Blueprint('questions', __name__, url_prefix='/api')


@questions_bp.route('/question-sets/<int:set_id>/questions', methods=['GET'])
@token_required
def get_questions(set_id):
    """
    Get all questions for a specific question set with user progress.

    Args:
        set_id (int): ID of the question set

    Returns:
        JSON response with questions and instructions
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Fetch instructions for this set (gracefully handle if table doesn't exist)
        instructions = []
        try:
            cur.execute('''
                SELECT instruction_text
                FROM set_instructions
                WHERE set_id = %s
                ORDER BY display_order
            ''', (set_id,))
            instructions = [row['instruction_text'] for row in cur.fetchall()]
        except Exception as inst_error:
            # Table might not exist yet (migration not run) - continue without instructions
            logger.warning(f"Could not fetch instructions for set {set_id}: {str(inst_error)}")
            instructions = []

        # Fetch questions
        cur.execute('''
            SELECT q.*,
                   up.attempted, up.correct, up.attempt_count, up.last_attempted,
                   mq.id IS NOT NULL as is_missed,
                   b.id IS NOT NULL as is_bookmarked
            FROM questions q
            LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON mq.question_id = q.id AND mq.user_id = %s
            LEFT JOIN bookmarks b ON b.question_id = q.id AND b.user_id = %s
            WHERE q.set_id = %s
            ORDER BY q.id
        ''', (request.current_user['id'], request.current_user['id'], request.current_user['id'], set_id))
        questions = cur.fetchall()
        cur.close()
        return jsonify({'questions': questions, 'instructions': instructions})
    except Exception as e:
        logger.error(f"Error fetching questions for set {set_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@questions_bp.route('/questions/<int:question_id>/progress', methods=['POST'])
@token_required
def update_progress(question_id):
    """
    Update user progress for a specific question.

    Args:
        question_id (int): ID of the question

    Request JSON:
        attempted (bool): Whether the question was attempted (default: True)
        correct (bool, optional): Whether the answer was correct

    Returns:
        JSON response with updated progress
    """
    conn = None
    try:
        data = request.json
        attempted = data.get('attempted', True)
        correct = data.get('correct', None)
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO user_progress (user_id, question_id, attempted, correct, attempt_count, last_attempted)
            VALUES (%s, %s, %s, %s, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, question_id)
            DO UPDATE SET
                attempted = EXCLUDED.attempted,
                correct = EXCLUDED.correct,
                attempt_count = user_progress.attempt_count + 1,
                last_attempted = CURRENT_TIMESTAMP
            RETURNING *
        ''', (request.current_user['id'], question_id, attempted, correct))
        progress = cur.fetchone()

        # Record daily activity for streak tracking
        cur.execute('''
            INSERT INTO daily_activity (user_id, activity_date, questions_practiced)
            VALUES (%s, CURRENT_DATE, 1)
            ON CONFLICT (user_id, activity_date)
            DO UPDATE SET questions_practiced = daily_activity.questions_practiced + 1
        ''', (request.current_user['id'],))

        conn.commit()
        cur.close()
        return jsonify({'success': True, 'progress': progress})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@questions_bp.route('/questions/<int:question_id>/mark-missed', methods=['POST'])
@token_required
def mark_missed(question_id):
    """
    Mark a question as missed (for review later).

    Args:
        question_id (int): ID of the question

    Returns:
        JSON response indicating success
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO missed_questions (user_id, question_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, question_id) DO NOTHING
            RETURNING *
        ''', (request.current_user['id'], question_id))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        return jsonify({'success': True, 'missed': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@questions_bp.route('/questions/<int:question_id>/unmark-missed', methods=['POST'])
@token_required
def unmark_missed(question_id):
    """
    Remove a question from the missed list.

    Args:
        question_id (int): ID of the question

    Returns:
        JSON response indicating success
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('DELETE FROM missed_questions WHERE user_id = %s AND question_id = %s',
                    (request.current_user['id'], question_id))
        conn.commit()
        cur.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@questions_bp.route('/questions/<int:question_id>/bookmark', methods=['POST'])
@token_required
def toggle_bookmark(question_id):
    """
    Toggle bookmark status for a question.

    Args:
        question_id (int): ID of the question

    Returns:
        JSON response with bookmark action and status
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Check if exists
        cur.execute('SELECT id FROM bookmarks WHERE user_id = %s AND question_id = %s',
                    (request.current_user['id'], question_id))
        existing = cur.fetchone()

        if existing:
            # Remove
            cur.execute('DELETE FROM bookmarks WHERE id = %s', (existing['id'],))
            action = 'removed'
            is_bookmarked = False
        else:
            # Add
            cur.execute('INSERT INTO bookmarks (user_id, question_id) VALUES (%s, %s)',
                        (request.current_user['id'], question_id))
            action = 'added'
            is_bookmarked = True

        conn.commit()
        cur.close()

        return jsonify({'success': True, 'action': action, 'is_bookmarked': is_bookmarked})
    except Exception as e:
        logger.error(f"Toggle bookmark error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@questions_bp.route('/questions/mixed', methods=['GET'])
@token_required
def get_mixed_questions():
    """
    Get random mixed questions from all sets with optional filtering.

    Query Parameters:
        filter (str): Filter type - 'all', 'unattempted', 'missed', or 'bookmarks' (default: 'all')
        limit (int, optional): Maximum number of questions to return
        offset (int, optional): Number of questions to skip (default: 0)

    Returns:
        JSON response with random questions matching the filter
    """
    conn = None
    try:
        filter_type = request.args.get('filter', 'all')
        # Optional pagination parameters (backward compatible - no limit by default)
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)

        conn = get_db()
        cur = conn.cursor()

        # Base query now includes is_bookmarked
        base_query = '''
            SELECT q.*, up.attempted, up.correct, up.attempt_count, up.last_attempted,
                   mq.id IS NOT NULL as is_missed,
                   b.id IS NOT NULL as is_bookmarked,
                   qs.name as set_name
            FROM questions q
            JOIN question_sets qs ON q.set_id = qs.id
            LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON mq.question_id = q.id AND mq.user_id = %s
            LEFT JOIN bookmarks b ON b.question_id = q.id AND b.user_id = %s
            WHERE qs.is_deleted = false
        '''

        params = [request.current_user['id'], request.current_user['id'], request.current_user['id']]

        if filter_type == 'unattempted':
            query = base_query + ' AND (up.id IS NULL OR up.attempted = false) ORDER BY RANDOM()'
        elif filter_type == 'missed':
            query = base_query + ' AND mq.id IS NOT NULL ORDER BY RANDOM()'
        elif filter_type == 'bookmarks':
            query = base_query + ' AND b.id IS NOT NULL ORDER BY RANDOM()'
        else:
            query = base_query + ' ORDER BY RANDOM()'

        # Add pagination if limit is specified
        if limit is not None:
            query += ' LIMIT %s OFFSET %s'
            params.extend([limit, offset])

        cur.execute(query, params)
        questions = cur.fetchall()
        cur.close()

        return jsonify({'questions': questions, 'filter_type': filter_type, 'total': len(questions)})
    except Exception as e:
        logger.error(f"Get mixed questions error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
