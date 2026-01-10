"""
Question Sets Routes

Handles CRUD operations for question sets including upload, listing, renaming, and deletion.
"""
import logging
from flask import Blueprint, request, jsonify

from auth import token_required
from services.database import get_db, return_db
from services.tsv_parser import parse_and_save_set

logger = logging.getLogger(__name__)

sets_bp = Blueprint('sets', __name__, url_prefix='/api')


@sets_bp.route('/upload-tsv', methods=['POST'])
@token_required
def upload_tsv():
    """
    Upload a TSV file and create a new question set.

    Form Data:
        file: TSV file to upload
        set_name (optional): Name for the set (defaults to filename)
        description (optional): Description for the set
        tags (optional): Comma-separated tags

    Returns:
        JSON response with upload results
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    set_name = request.form.get('set_name', file.filename)
    set_description = request.form.get('description', '')
    tags = request.form.get('tags', '')

    if not file.filename.endswith('.tsv'):
        return jsonify({'error': 'File must be a TSV file'}), 400

    # Validate MIME type to prevent uploading malicious files with .tsv extension
    allowed_mime_types = [
        'text/tab-separated-values',
        'text/plain',
        'application/octet-stream',  # Some browsers use this for .tsv files
        'text/tsv'
    ]
    if file.content_type and file.content_type not in allowed_mime_types:
        logger.warning(f"Rejected file upload with invalid MIME type: {file.content_type}")
        return jsonify({
            'error': 'Invalid file type',
            'message': f'File must be a TSV file (detected type: {file.content_type})'
        }), 400

    try:
        # Read the file content with better error handling
        raw_content = file.read()

        # Try UTF-8 first, then fallback to other encodings
        try:
            content = raw_content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content = raw_content.decode('utf-8-sig')  # UTF-8 with BOM
            except UnicodeDecodeError:
                try:
                    content = raw_content.decode('latin-1')  # Fallback
                except UnicodeDecodeError:
                    return jsonify({'error': 'File encoding not supported. Please save as UTF-8.'}), 400

        # Check file size
        if len(content) > 10 * 1024 * 1024:  # 10MB text limit
            return jsonify({'error': 'File too large. Maximum 10MB of text content.'}), 400

        logger.info(f"Processing TSV upload: {file.filename}, size: {len(content)} bytes")

        set_id, count, expected, is_partial, processing_time = parse_and_save_set(
            content=content,
            set_name=set_name,
            description=set_description,
            user_id=request.current_user['id'],
            tags=tags
        )

        response = {
            'success': True,
            'set_id': set_id,
            'questions_imported': count,
            'expected_questions': expected,
            'is_partial': is_partial,
            'processing_time': round(processing_time, 2),
            'set_name': set_name
        }

        if is_partial:
            # Provide better warning messages based on whether it was a timeout or data issue
            if processing_time > 20:
                response['warning'] = f'Upload took {round(processing_time)}s. Only {count} of {expected} questions were imported. File may be too large for free tier (30s timeout). Consider splitting into smaller files.'
            else:
                response['warning'] = f'Only {count} of {expected} questions were imported. Some rows may be missing required fields (questionText AND answerText).'

        return jsonify(response)

    except UnicodeDecodeError as e:
        logger.error(f"Encoding error in TSV upload: {str(e)}")
        return jsonify({'error': 'File encoding error. Please save your file as UTF-8.'}), 400
    except Exception as e:
        logger.error(f"Upload TSV error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Failed to parse TSV: {str(e)}'}), 500


@sets_bp.route('/question-sets', methods=['GET'])
@token_required
def get_question_sets():
    """
    Get all question sets for the authenticated user.

    Query Parameters:
        limit (int, optional): Maximum number of sets to return
        offset (int, optional): Number of sets to skip (default: 0)

    Returns:
        JSON response with list of question sets including progress info
    """
    conn = None
    try:
        # Optional pagination parameters (backward compatible - no limit by default)
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)

        conn = get_db()
        cur = conn.cursor()

        # Build query with optional LIMIT and OFFSET
        query = '''
            SELECT qs.*, u.username as uploaded_by_username,
                   COUNT(up.id) FILTER (WHERE up.user_id = %s AND up.attempted = true) as questions_attempted,
                   so.id IS NOT NULL as directly_opened,
                   so.opened_at as last_opened
            FROM question_sets qs
            LEFT JOIN users u ON qs.uploaded_by = u.id
            LEFT JOIN questions q ON q.set_id = qs.id
            LEFT JOIN user_progress up ON up.question_id = q.id
            LEFT JOIN set_opens so ON so.set_id = qs.id AND so.user_id = %s
            WHERE qs.is_deleted = false
            GROUP BY qs.id, u.username, so.id, so.opened_at
            ORDER BY qs.created_at DESC
        '''
        params = [request.current_user['id'], request.current_user['id']]

        # Add pagination if limit is specified
        if limit is not None:
            query += ' LIMIT %s OFFSET %s'
            params.extend([limit, offset])

        cur.execute(query, params)
        sets = cur.fetchall()
        cur.close()
        return jsonify({'sets': sets})
    except Exception as e:
        logger.error(f"Error fetching question sets: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@sets_bp.route('/question-sets/<int:set_id>/mark-opened', methods=['POST'])
@token_required
def mark_set_opened(set_id):
    """
    Mark a question set as opened by the current user.

    Args:
        set_id (int): ID of the question set

    Returns:
        JSON response indicating success
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO set_opens (user_id, set_id, opened_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, set_id) DO UPDATE SET opened_at = CURRENT_TIMESTAMP
        ''', (request.current_user['id'], set_id))
        conn.commit()
        cur.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@sets_bp.route('/question-sets/<int:set_id>/rename', methods=['PUT'])
@token_required
def rename_question_set(set_id):
    """
    Rename a question set (only the owner can rename).

    Args:
        set_id (int): ID of the question set

    Request JSON:
        name (str): New name for the set

    Returns:
        JSON response indicating success or error
    """
    conn = None
    try:
        data = request.json
        new_name = data.get('name')

        if not new_name or not new_name.strip():
            return jsonify({'error': 'Name cannot be empty'}), 400

        conn = get_db()
        cur = conn.cursor()

        # Check ownership
        cur.execute('SELECT uploaded_by FROM question_sets WHERE id = %s', (set_id,))
        question_set = cur.fetchone()

        if not question_set:
            return jsonify({'error': 'Question set not found'}), 404
        if question_set['uploaded_by'] != request.current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403

        # Update name
        cur.execute('UPDATE question_sets SET name = %s WHERE id = %s', (new_name.strip(), set_id))
        conn.commit()
        cur.close()

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Rename set error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)


@sets_bp.route('/question-sets/<int:set_id>', methods=['DELETE'])
@token_required
def delete_question_set(set_id):
    """
    Soft delete a question set (only the owner can delete).

    Args:
        set_id (int): ID of the question set

    Returns:
        JSON response indicating success or error
    """
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT uploaded_by FROM question_sets WHERE id = %s', (set_id,))
        question_set = cur.fetchone()
        if not question_set:
            return jsonify({'error': 'Question set not found'}), 404
        if question_set['uploaded_by'] != request.current_user['id']:
            return jsonify({'error': 'Unauthorized'}), 403
        cur.execute('UPDATE question_sets SET is_deleted = true WHERE id = %s', (set_id,))
        conn.commit()
        cur.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
