"""
Public Routes (Guest Mode)

Unauthenticated endpoints that allow guest users to browse and practice questions
without creating an account. No user-specific progress tracking.
"""
import logging
from flask import Blueprint, request, jsonify

from services.database import get_db, return_db

logger = logging.getLogger(__name__)

public_bp = Blueprint('public', __name__, url_prefix='/api/public')


@public_bp.route('/question-sets', methods=['GET'])
def get_public_question_sets():
    """
    Get all question sets without user-specific progress (for guest users).

    Query Parameters:
        limit (int, optional): Maximum number of sets to return
        offset (int, optional): Number of sets to skip (default: 0)

    Returns:
        JSON response with list of question sets
    """
    conn = None
    try:
        # Optional pagination parameters
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)

        conn = get_db()
        cur = conn.cursor()

        # Build query without user-specific joins
        query = '''
            SELECT qs.id, qs.name, qs.description, qs.tags, qs.created_at,
                   u.username as uploaded_by_username,
                   COUNT(q.id) as total_questions
            FROM question_sets qs
            LEFT JOIN users u ON qs.uploaded_by = u.id
            LEFT JOIN questions q ON q.set_id = qs.id
            WHERE qs.is_deleted = false
            GROUP BY qs.id, u.username
            ORDER BY qs.created_at DESC
        '''
        params = []

        # Add pagination if limit is specified
        if limit is not None:
            query += ' LIMIT %s OFFSET %s'
            params.extend([limit, offset])

        cur.execute(query, params)
        sets = cur.fetchall()
        cur.close()
        return jsonify({'sets': sets})
    except Exception as e:
        logger.error(f"Error fetching public question sets: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@public_bp.route('/question-sets/<int:set_id>/questions', methods=['GET'])
def get_public_questions(set_id):
    """
    Get questions for a set without user progress (for guest users).

    Args:
        set_id (int): ID of the question set

    Returns:
        JSON response with questions and instructions for the set
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()

        # Fetch instructions for this set
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
            logger.warning(f"Could not fetch instructions for set {set_id}: {str(inst_error)}")
            instructions = []

        # Fetch questions without user progress
        cur.execute('''
            SELECT q.id, q.set_id, q.round_no, q.question_no,
                   q.question_text, q.answer_text, q.image_url
            FROM questions q
            WHERE q.set_id = %s
            ORDER BY q.id
        ''', (set_id,))
        questions = cur.fetchall()
        cur.close()
        return jsonify({'questions': questions, 'instructions': instructions})
    except Exception as e:
        logger.error(f"Error fetching public questions for set {set_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@public_bp.route('/questions/mixed', methods=['GET'])
def get_public_mixed_questions():
    """
    Get random mixed questions without user progress (for guest users).

    Query Parameters:
        limit (int, optional): Maximum number of questions to return
        offset (int, optional): Number of questions to skip (default: 0)

    Returns:
        JSON response with random questions from all sets
    """
    conn = None
    try:
        # Guest users get all questions randomly - no filtering by unattempted/missed/bookmarks
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)

        conn = get_db()
        cur = conn.cursor()

        # Base query without user-specific joins
        query = '''
            SELECT q.id, q.set_id, q.round_no, q.question_no,
                   q.question_text, q.answer_text, q.image_url,
                   qs.name as set_name
            FROM questions q
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE qs.is_deleted = false
            ORDER BY RANDOM()
        '''
        params = []

        # Add pagination if limit is specified
        if limit is not None:
            query += ' LIMIT %s OFFSET %s'
            params.extend([limit, offset])

        cur.execute(query, params)
        questions = cur.fetchall()
        cur.close()
        return jsonify({'questions': questions})
    except Exception as e:
        logger.error(f"Error fetching public mixed questions: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
