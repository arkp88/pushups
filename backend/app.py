import os
import csv
import io
import jwt
import hashlib
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
DATABASE_URL = os.getenv('DATABASE_URL')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
GOOGLE_DRIVE_API_KEY = os.getenv('GOOGLE_DRIVE_API_KEY')

# Validate required environment variables
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
if not SUPABASE_JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET environment variable is required")

# Connection pool for better performance
connection_pool = None
try:
    connection_pool = psycopg2.pool.ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        dsn=DATABASE_URL
    )
    logger.info("Database connection pool created successfully")
except Exception as e:
    logger.error(f"Failed to create connection pool: {str(e)}")
    raise

def get_db():
    """Get database connection from pool"""
    try:
        conn = connection_pool.getconn()
        # Set cursor factory for this connection
        conn.cursor_factory = RealDictCursor
        return conn
    except Exception as e:
        logger.error(f"Failed to get database connection: {str(e)}")
        raise

def return_db(conn):
    """Return database connection to pool"""
    if conn:
        try:
            # Rollback any pending transaction before returning
            if not conn.closed:
                conn.rollback()
            connection_pool.putconn(conn)
        except Exception as e:
            logger.error(f"Failed to return connection to pool: {str(e)}")

def verify_supabase_token(token):
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=['HS256'], audience='authenticated')
        return payload
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            logger.warning("Missing authorization header")
            return jsonify({'error': 'Authentication required', 'message': 'Token is missing'}), 401
        
        conn = None
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = verify_supabase_token(token)
            if not payload:
                logger.warning("Invalid token provided")
                return jsonify({'error': 'Invalid token', 'message': 'Token verification failed'}), 401
            
            supabase_user_id = payload.get('sub')
            email = payload.get('email')
            
            if not supabase_user_id or not email:
                logger.error("Token missing required fields")
                return jsonify({'error': 'Invalid token structure'}), 401
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute('SELECT * FROM users WHERE supabase_user_id = %s', (supabase_user_id,))
            user = cur.fetchone()
            
            if not user:
                username = email.split('@')[0]
                cur.execute(
                    'INSERT INTO users (supabase_user_id, email, username) VALUES (%s, %s, %s) RETURNING *',
                    (supabase_user_id, email, username)
                )
                user = cur.fetchone()
                conn.commit()
                logger.info(f"Created new user: {username}")
            
            cur.close()
            request.current_user = user
            
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT validation error: {str(e)}")
            return jsonify({'error': 'Invalid token', 'message': 'Token verification failed'}), 401
        except psycopg2.Error as e:
            logger.error(f"Database error in auth: {str(e)}")
            if conn:
                conn.rollback()
            return jsonify({'error': 'Database error', 'message': 'Failed to authenticate user'}), 500
        except Exception as e:
            logger.error(f"Unexpected auth error: {str(e)}")
            return jsonify({'error': 'Authentication failed', 'message': str(e)}), 401
        finally:
            if conn:
                return_db(conn)
        return f(*args, **kwargs)
    return decorated

# --- HELPER: Parse and Save ---
def parse_and_save_set(content, set_name, description, user_id, tags='', google_id=None):
    """Parses TSV content and saves to DB. Returns (set_id, question_count)."""
    
    # 1. Generate Content Hash (SHA-256)
    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

    conn = get_db()
    cur = conn.cursor()
    
    try:
        # 2. Check for DUPLICATES
        # Check if THIS user has already uploaded this EXACT content
        cur.execute('''
            SELECT id FROM question_sets 
            WHERE content_hash = %s AND uploaded_by = %s AND is_deleted = false
        ''', (content_hash, user_id))
        
        existing = cur.fetchone()
        if existing:
            # STOP: Return existing ID. 
            return existing['id'], 0

        # ... (Standard parsing logic) ...
        content = content.replace('\r\n', '\n').replace('\r', '\n')
        reader = csv.DictReader(io.StringIO(content), delimiter='\t')
        
        required_headers = ['questionText', 'answerText']
        if not reader.fieldnames or not all(h in reader.fieldnames for h in required_headers):
             if ',' in content.split('\n')[0] and '\t' not in content.split('\n')[0]:
                 raise Exception("File appears to be CSV, not TSV.")
             raise Exception(f"Missing required columns. Found: {reader.fieldnames}")

        # 3. Insert New Set (Include content_hash)
        cur.execute(
            '''INSERT INTO question_sets 
               (name, description, uploaded_by, tags, is_deleted, google_drive_id, content_hash) 
               VALUES (%s, %s, %s, %s, %s, %s, %s) 
               RETURNING id''',
            (set_name, description, user_id, tags, False, google_id, content_hash)
        )
        set_id = cur.fetchone()['id']
        
        question_count = 0
        for row in reader:
            round_no = row.get('roundNo', '').strip()
            question_no = row.get('questionNo', '').strip()
            question_text = row.get('questionText', '').strip()
            image_url = row.get('imageUrl', '').strip()
            answer_text = row.get('answerText', '').strip()
            
            if image_url.startswith('__') and image_url.endswith('__'):
                image_url = image_url.strip('_')
            
            if question_text and answer_text:
                cur.execute(
                    '''INSERT INTO questions 
                       (set_id, round_no, question_no, question_text, image_url, answer_text)
                       VALUES (%s, %s, %s, %s, %s, %s)''',
                    (set_id, round_no, question_no, question_text, 
                     image_url if image_url else None, answer_text)
                )
                question_count += 1
        
        cur.execute('UPDATE question_sets SET total_questions = %s WHERE id = %s', (question_count, set_id))
        conn.commit()
        return set_id, question_count

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        if cur:
            cur.close()
        return_db(conn)

# --- GOOGLE DRIVE ---
def get_drive_service():
    if not GOOGLE_DRIVE_API_KEY:
        raise Exception("GOOGLE_DRIVE_API_KEY not set")
    return build('drive', 'v3', developerKey=GOOGLE_DRIVE_API_KEY)

@app.route('/api/drive/files', methods=['GET'])
@token_required
def list_drive_files():
    try:
        service = get_drive_service()
        root_folder_id = request.args.get('folderId')
        if not root_folder_id:
            return jsonify({'error': 'Folder ID required'}), 400

        query = f"'{root_folder_id}' in parents and (mimeType = 'application/vnd.google-apps.folder' or name contains '.tsv') and trashed = false"
        
        all_files = []
        page_token = None
        
        while True:
            results = service.files().list(
                q=query, 
                pageSize=1000,  # Increased page size
                orderBy="folder,name",
                fields="nextPageToken, files(id, name, mimeType)",
                pageToken=page_token
            ).execute()
            
            items = results.get('files', [])
            all_files.extend(items)
            
            page_token = results.get('nextPageToken')
            if not page_token:
                break
        
        return jsonify({'files': all_files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    # The erroneous 'finally' block is now removed.

@app.route('/api/drive/import', methods=['POST'])
@token_required
def import_drive_file():
    data = request.json
    file_id = data.get('fileId')
    set_name = data.get('setName') 
    tags = data.get('tags', '')
    
    conn = get_db()
    cur = conn.cursor()
    
    # 1. Check if already imported
    cur.execute('SELECT id FROM question_sets WHERE google_drive_id = %s AND is_deleted = false', (file_id,))
    existing = cur.fetchone()
    if existing:
        return jsonify({'success': True, 'set_id': existing['id'], 'message': 'Already imported'})

    try:
        service = get_drive_service()
        # For public files, simple get_media usually works with API Key
        request_drive = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request_drive)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            
        content = fh.getvalue().decode('utf-8')
        
        set_id, count = parse_and_save_set(
            content=content,
            set_name=set_name,
            description="Imported from Google Drive",
            user_id=request.current_user['id'],
            tags=tags,
            google_id=file_id
        )
        
        return jsonify({'success': True, 'set_id': set_id, 'questions_imported': count})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

# --- ROUTES ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/upload-tsv', methods=['POST'])
@token_required
def upload_tsv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    set_name = request.form.get('set_name', file.filename)
    set_description = request.form.get('description', '')
    tags = request.form.get('tags', '')
    
    if not file.filename.endswith('.tsv'):
        return jsonify({'error': 'File must be a TSV file'}), 400
    
    try:
        content = file.read().decode('utf-8')
        set_id, count = parse_and_save_set(
            content=content,
            set_name=set_name,
            description=set_description,
            user_id=request.current_user['id'],
            tags=tags
        )
        
        return jsonify({'success': True, 'set_id': set_id, 'questions_imported': count, 'set_name': set_name})
    
    except Exception as e:
        return jsonify({'error': f'Failed to parse TSV: {str(e)}'}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/question-sets', methods=['GET'])
@token_required
def get_question_sets():
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT qs.*, u.username as uploaded_by_username,
                   COUNT(up.id) FILTER (WHERE up.user_id = %s AND up.attempted = true) as questions_attempted,
                   so.id IS NOT NULL as directly_opened
            FROM question_sets qs
            LEFT JOIN users u ON qs.uploaded_by = u.id
            LEFT JOIN questions q ON q.set_id = qs.id
            LEFT JOIN user_progress up ON up.question_id = q.id
            LEFT JOIN set_opens so ON so.set_id = qs.id AND so.user_id = %s
            WHERE qs.is_deleted = false
            GROUP BY qs.id, u.username, so.id
            ORDER BY qs.created_at DESC
        ''', (request.current_user['id'], request.current_user['id']))
        sets = cur.fetchall()
        cur.close()
        return jsonify({'sets': sets})
    except Exception as e:
        logger.error(f"Error fetching question sets: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/question-sets/<int:set_id>/questions', methods=['GET'])
@token_required
def get_questions(set_id):
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT q.*,
                   up.attempted, up.correct, up.attempt_count, up.last_attempted,
                   mq.id IS NOT NULL as is_missed,
                   b.id IS NOT NULL as is_bookmarked  -- <--- ADD THIS
            FROM questions q
            LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON mq.question_id = q.id AND mq.user_id = %s
            LEFT JOIN bookmarks b ON b.question_id = q.id AND b.user_id = %s -- <--- JOIN THIS
            WHERE q.set_id = %s
            ORDER BY q.id
        ''', (request.current_user['id'], request.current_user['id'], request.current_user['id'], set_id))
        questions = cur.fetchall()
        cur.close()
        return jsonify({'questions': questions})
    except Exception as e:
        logger.error(f"Error fetching questions for set {set_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/question-sets/<int:set_id>/mark-opened', methods=['POST'])
@token_required
def mark_set_opened(set_id):
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

@app.route('/api/questions/<int:question_id>/progress', methods=['POST'])
@token_required
def update_progress(question_id):
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
        conn.commit()
        cur.close()
        return jsonify({'success': True, 'progress': progress})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/question-sets/<int:set_id>/rename', methods=['PUT'])
@token_required
def rename_question_set(set_id):
    """Rename a question set"""
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
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/questions/<int:question_id>/mark-missed', methods=['POST'])
@token_required
def mark_missed(question_id):
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

@app.route('/api/questions/<int:question_id>/unmark-missed', methods=['POST'])
@token_required
def unmark_missed(question_id):
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

@app.route('/api/missed-questions', methods=['GET'])
@token_required
def get_missed_questions():
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

@app.route('/api/question-sets/<int:set_id>', methods=['DELETE'])
@token_required
def delete_question_set(set_id):
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

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    conn = None
    cur = None
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute('SELECT COUNT(q.id) as total FROM questions q JOIN question_sets qs ON q.set_id = qs.id WHERE qs.is_deleted = false')
        total_questions = cur.fetchone()['total']
        
        cur.execute('''
            SELECT COUNT(up.id) as attempted FROM user_progress up
            JOIN questions q ON up.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE up.user_id = %s AND up.attempted = true AND qs.is_deleted = false
        ''', (request.current_user['id'],))
        attempted = cur.fetchone()['attempted']
        
        cur.execute('''
            SELECT COUNT(up.id) as correct FROM user_progress up
            JOIN questions q ON up.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE up.user_id = %s AND up.correct = true AND qs.is_deleted = false
        ''', (request.current_user['id'],))
        correct = cur.fetchone()['correct']
        
        cur.execute('''
            SELECT COUNT(mq.id) as missed FROM missed_questions mq
            JOIN questions q ON mq.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE mq.user_id = %s AND qs.is_deleted = false
        ''', (request.current_user['id'],))
        missed = cur.fetchone()['missed']
        
        cur.execute('''
            SELECT COUNT(b.id) as bookmarks 
            FROM bookmarks b
            JOIN questions q ON b.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE b.user_id = %s AND qs.is_deleted = false
        ''', (request.current_user['id'],))
        bookmarks = cur.fetchone()['bookmarks']

        if cur:
            cur.close()
        
        return jsonify({
            'total_questions': total_questions,
            'attempted': attempted,
            'correct': correct,
            'missed': missed,
            'bookmarks': bookmarks,
            'accuracy': round((correct / attempted * 100) if attempted > 0 else 0, 1)
        })
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/questions/<int:question_id>/bookmark', methods=['POST'])
@token_required
def toggle_bookmark(question_id):
    """Toggle bookmark status for a question"""
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
        conn.close()
        
        return jsonify({'success': True, 'action': action, 'is_bookmarked': is_bookmarked})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/questions/mixed', methods=['GET'])
@token_required
def get_mixed_questions():
    try:
        filter_type = request.args.get('filter', 'all')
        conn = get_db()
        cur = conn.cursor()
        
        # Base query now includes is_bookmarked
        base_query = '''
            SELECT q.*, up.attempted, up.correct, up.attempt_count, up.last_attempted,
                   mq.id IS NOT NULL as is_missed, 
                   b.id IS NOT NULL as is_bookmarked, -- <--- ADD THIS
                   qs.name as set_name
            FROM questions q
            JOIN question_sets qs ON q.set_id = qs.id
            LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON mq.question_id = q.id AND mq.user_id = %s
            LEFT JOIN bookmarks b ON b.question_id = q.id AND b.user_id = %s -- <--- JOIN THIS
            WHERE qs.is_deleted = false
        '''
        
        params = [request.current_user['id'], request.current_user['id'], request.current_user['id']]

        if filter_type == 'unattempted':
            query = base_query + ' AND (up.id IS NULL OR up.attempted = false) ORDER BY RANDOM()'
        elif filter_type == 'missed':
            query = base_query + ' AND mq.id IS NOT NULL ORDER BY RANDOM()'
        elif filter_type == 'bookmarks': # <--- NEW FILTER
            query = base_query + ' AND b.id IS NOT NULL ORDER BY RANDOM()'
        else:
            query = base_query + ' ORDER BY RANDOM()'
            
        cur.execute(query, params)
        questions = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({'questions': questions, 'filter_type': filter_type, 'total': len(questions)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)
    
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)