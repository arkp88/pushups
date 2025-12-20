import os
import csv
import io
import re
import jwt
import hashlib
import logging
import time
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import bleach

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

# CORS configuration - whitelist specific origins
allowed_origins = ['http://localhost:3000']
frontend_url = os.getenv('FRONTEND_URL', '').strip()
if frontend_url:
    # Remove trailing slash if present
    frontend_url = frontend_url.rstrip('/')
    allowed_origins.append(frontend_url)

logger.info(f"CORS allowed origins: {allowed_origins}")
CORS(app, origins=allowed_origins)

# Rate limiting configuration - use user ID when authenticated, otherwise IP
def get_rate_limit_key():
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

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['MAX_CONTENT_PATH'] = None  # No path-specific limits
DATABASE_URL = os.getenv('DATABASE_URL')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
GOOGLE_DRIVE_API_KEY = os.getenv('GOOGLE_DRIVE_API_KEY')

# Error handler for file too large
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'error': 'File too large',
        'message': 'The uploaded file exceeds the maximum size limit of 16MB. Please upload a smaller file.'
    }), 413

# Validate required environment variables
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")
if not SUPABASE_JWT_SECRET:
    raise ValueError("SUPABASE_JWT_SECRET environment variable is required")
if not app.config['SECRET_KEY']:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

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
def convert_markdown_to_html(text):
    """Convert simple markdown formatting to HTML and sanitize output."""
    if not text:
        return text

    # Convert **bold** to <strong>bold</strong> (DOTALL flag to match across newlines)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text, flags=re.DOTALL)

    # Convert *italic* to <em>italic</em> (but not if part of **)
    # Use negative lookbehind and lookahead to avoid matching ** markers
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', text, flags=re.DOTALL)

    # Convert _italic_ to <em>italic</em>
    text = re.sub(r'_(.+?)_', r'<em>\1</em>', text, flags=re.DOTALL)

    # Sanitize HTML to prevent XSS attacks - only allow safe formatting tags
    allowed_tags = ['strong', 'em', 'br', 'p']
    text = bleach.clean(text, tags=allowed_tags, strip=True)

    return text

def count_valid_questions(content):
    """Count ONLY valid question rows (with both questionText AND answerText).
    Excludes: empty lines, header, instruction rows."""
    try:
        # Normalize line endings
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove BOM if present
        if content.startswith('\ufeff'):
            content = content[1:]

        reader = csv.DictReader(io.StringIO(content), delimiter='\t')
        count = 0

        for row in reader:
            round_no = (row.get('roundNo', '') or '').strip()
            question_text = (row.get('questionText', '') or '').strip()
            answer_text = (row.get('answerText', '') or '').strip()

            # Skip instruction rows
            if round_no.lower() == 'instructions':
                continue

            # Count only rows with both question AND answer
            if question_text and answer_text:
                count += 1

        return count
    except Exception:
        # If counting fails, return 0 to avoid breaking the upload
        return 0

def parse_and_save_set(content, set_name, description, user_id, tags='', google_id=None):
    """Parses TSV content and saves to DB. Returns (set_id, question_count, expected_count, is_partial, processing_time)."""

    # Start timing
    start_time = time.time()

    # 1. Generate Content Hash (SHA-256)
    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

    # Count expected questions before processing (only valid questions)
    expected_count = count_valid_questions(content)

    conn = get_db()
    cur = conn.cursor()

    try:
        # 2. Check for DUPLICATES
        # Check if THIS user has already uploaded this EXACT content
        cur.execute('''
            SELECT id, total_questions FROM question_sets
            WHERE content_hash = %s AND uploaded_by = %s AND is_deleted = false
        ''', (content_hash, user_id))

        existing = cur.fetchone()
        if existing:
            # STOP: Return existing ID.
            processing_time = time.time() - start_time
            logger.info(f"Duplicate content detected for user {user_id}, returning existing set {existing['id']}")
            return existing['id'], existing['total_questions'], expected_count, False, processing_time

        # ... (Standard parsing logic) ...
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove BOM if present
        if content.startswith('\ufeff'):
            content = content[1:]

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
        except csv.Error as e:
            raise Exception(f"CSV parsing error: {str(e)}. Ensure your file is properly formatted with tab separators.")

        required_headers = ['questionText', 'answerText']

        # Filter out empty column names
        fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]

        logger.info(f"TSV Headers detected: {fieldnames}")

        if not fieldnames or not all(h in fieldnames for h in required_headers):
             if ',' in content.split('\n')[0] and '\t' not in content.split('\n')[0]:
                 raise Exception("File appears to be CSV, not TSV. Please use tab-separated values.")
             raise Exception(f"Missing required columns: {required_headers}. Found: {fieldnames}")

        # 3. Insert New Set (Include content_hash)
        cur.execute(
            '''INSERT INTO question_sets 
               (name, description, uploaded_by, tags, is_deleted, google_drive_id, content_hash) 
               VALUES (%s, %s, %s, %s, %s, %s, %s) 
               RETURNING id''',
            (set_name, description, user_id, tags, False, google_id, content_hash)
        )
        set_id = cur.fetchone()['id']

        # Extract and save instructions BEFORE processing questions
        instructions = []
        content_for_instructions = content.replace('\r\n', '\n').replace('\r', '\n')
        if content_for_instructions.startswith('\ufeff'):
            content_for_instructions = content_for_instructions[1:]

        temp_reader = csv.DictReader(io.StringIO(content_for_instructions), delimiter='\t')
        for row in temp_reader:
            round_no = (row.get('roundNo', '') or '').strip()

            # Instruction text can be in questionNo OR questionText column
            # (depends on how many tabs are in the row)
            instruction_text = (row.get('questionNo', '') or '').strip()
            if not instruction_text:
                instruction_text = (row.get('questionText', '') or '').strip()

            if round_no.lower() == 'instructions' and instruction_text:
                instructions.append(instruction_text)
                logger.info(f"Found instruction: {instruction_text[:60]}")

        # Save instructions to database
        logger.info(f"Saving {len(instructions)} instructions for set {set_id}")
        if instructions:
            for idx, instruction in enumerate(instructions):
                cur.execute(
                    '''INSERT INTO set_instructions (set_id, instruction_text, display_order)
                       VALUES (%s, %s, %s)''',
                    (set_id, instruction, idx)
                )
            logger.info(f"Successfully saved {len(instructions)} instructions")

        question_count = 0
        batch_size = 100
        questions_batch = []
        line_number = 2  # Start at 2 (1 is header)

        try:
            for row in reader:
                try:
                    # Use 'or' to handle None values from empty TSV cells
                    round_no = (row.get('roundNo', '') or '').strip()

                    # Skip instruction rows - they're handled separately
                    if round_no.lower() == 'instructions':
                        line_number += 1
                        continue

                    question_no = (row.get('questionNo', '') or '').strip()
                    question_text = (row.get('questionText', '') or '').strip()
                    image_url = (row.get('imageUrl', '') or '').strip()
                    answer_text = (row.get('answerText', '') or '').strip()

                    if image_url.startswith('__') and image_url.endswith('__'):
                        image_url = image_url.strip('_')

                    # Store raw markdown - conversion will happen on frontend
                    # question_text = convert_markdown_to_html(question_text)
                    # answer_text = convert_markdown_to_html(answer_text)

                    if question_text and answer_text:
                        questions_batch.append((
                            set_id, round_no, question_no, question_text,
                            image_url if image_url else None, answer_text
                        ))
                        question_count += 1

                        # Batch insert for better performance
                        if len(questions_batch) >= batch_size:
                            cur.executemany(
                                '''INSERT INTO questions
                                   (set_id, round_no, question_no, question_text, image_url, answer_text)
                                   VALUES (%s, %s, %s, %s, %s, %s)''',
                                questions_batch
                            )
                            questions_batch = []

                    line_number += 1

                except csv.Error as e:
                    raise Exception(f"CSV parsing error at line {line_number}: {str(e)}")
                except Exception as e:
                    # If it's not a CSV error, still provide line context
                    if 'line' not in str(e).lower():
                        raise Exception(f"Error processing line {line_number}: {str(e)}")
                    raise
        except csv.Error as e:
            raise Exception(f"CSV parsing error at line {line_number}: {str(e)}")

        # Insert remaining questions
        if questions_batch:
            cur.executemany(
                '''INSERT INTO questions
                   (set_id, round_no, question_no, question_text, image_url, answer_text)
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                questions_batch
            )

        # Validate: Reject files with only instructions and no questions
        if question_count == 0:
            if instructions:
                raise Exception("File contains only instructions, no questions found. Please add questions with both questionText and answerText.")
            else:
                raise Exception("No valid questions found. Each question must have both questionText and answerText.")

        cur.execute('UPDATE question_sets SET total_questions = %s WHERE id = %s', (question_count, set_id))
        conn.commit()

        # Calculate processing time
        processing_time = time.time() - start_time

        # Smart partial detection - only flag as partial if:
        # 1. Processing took longer than threshold (indicating possible timeout), OR
        # 2. We imported significantly fewer questions than expected (>20% missing)
        TIMEOUT_THRESHOLD = 20  # seconds
        is_partial = False
        timeout_detected = processing_time > TIMEOUT_THRESHOLD

        if timeout_detected:
            is_partial = True
        elif question_count > 0 and expected_count > 0:
            missing_percentage = (expected_count - question_count) / expected_count
            if missing_percentage > 0.2:  # More than 20% missing
                is_partial = True

        if is_partial:
            logger.warning(f"Partial upload: {question_count}/{expected_count} questions imported for set {set_id} (took {processing_time:.2f}s)")
        else:
            logger.info(f"Successfully imported {question_count} questions into set {set_id} (took {processing_time:.2f}s)")

        return set_id, question_count, expected_count, is_partial, processing_time

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

@app.route('/api/drive/files/recursive', methods=['GET'])
@token_required
def list_drive_files_recursive():
    """Recursively list all TSV files in folder and all subfolders"""
    try:
        service = get_drive_service()
        root_folder_id = request.args.get('folderId')
        if not root_folder_id:
            return jsonify({'error': 'Folder ID required'}), 400

        # Track API calls to prevent hanging on massive folder structures
        api_call_count = {'count': 0}
        MAX_API_CALLS = 100  # Limit to prevent infinite recursion/timeout

        # Recursive function to get all TSV files
        def get_tsv_files_recursive(folder_id, path=""):
            all_tsv_files = []

            # Check if we've hit the API call limit
            api_call_count['count'] += 1
            if api_call_count['count'] > MAX_API_CALLS:
                raise Exception(f'Folder structure too large (scanned {MAX_API_CALLS} folders). Please select a smaller folder.')

            # Get all items in current folder
            query = f"'{folder_id}' in parents and trashed = false"
            results = service.files().list(
                q=query,
                fields="files(id, name, mimeType)",
                pageSize=1000
            ).execute()

            items = results.get('files', [])

            for item in items:
                if item['mimeType'] == 'application/vnd.google-apps.folder':
                    # Recursively get files from subfolder
                    subfolder_path = f"{path}/{item['name']}" if path else item['name']
                    all_tsv_files.extend(
                        get_tsv_files_recursive(item['id'], subfolder_path)
                    )
                elif item['name'].endswith('.tsv'):
                    # Add TSV file with full path
                    all_tsv_files.append({
                        'id': item['id'],
                        'name': item['name'],
                        'mimeType': item['mimeType'],
                        'path': path,
                        'fullPath': f"{path}/{item['name']}" if path else item['name']
                    })

            return all_tsv_files

        files = get_tsv_files_recursive(root_folder_id)

        # Hard limit to prevent abuse and ensure reliability
        # 50 files = ~100 seconds processing time (2s per file avg)
        # This stays well under rate limits and timeout constraints
        MAX_FILES = 50
        if len(files) > MAX_FILES:
            return jsonify({
                'error': f'Found {len(files)} files, but recursive import is limited to {MAX_FILES} files per batch to ensure reliable imports.',
                'count': len(files),
                'limit': MAX_FILES
            }), 400

        return jsonify({
            'files': files,
            'count': len(files)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/drive/import', methods=['POST'])
@token_required
@limiter.limit("100 per hour")  # Allow batch uploads (20+ files), prevent extreme abuse
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

        set_id, count, expected, is_partial, processing_time = parse_and_save_set(
            content=content,
            set_name=set_name,
            description="Imported from Google Drive",
            user_id=request.current_user['id'],
            tags=tags,
            google_id=file_id
        )

        response = {
            'success': True,
            'set_id': set_id,
            'questions_imported': count,
            'expected_questions': expected,
            'is_partial': is_partial,
            'processing_time': round(processing_time, 2)
        }

        if is_partial:
            # Provide better warning messages based on whether it was a timeout or data issue
            if processing_time > 20:
                response['warning'] = f'Upload took {round(processing_time)}s. Only {count} of {expected} questions were imported. File may be too large for free tier (30s timeout). Consider splitting into smaller files.'
            else:
                response['warning'] = f'Only {count} of {expected} questions were imported. Some rows may be missing required fields (questionText AND answerText).'

        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

# --- ROUTES ---

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

# ============================================================================
# PUBLIC ENDPOINTS (No authentication required - for guest mode)
# ============================================================================

@app.route('/api/public/question-sets', methods=['GET'])
def get_public_question_sets():
    """Get all question sets without user-specific progress (for guest users)"""
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

@app.route('/api/public/question-sets/<int:set_id>/questions', methods=['GET'])
def get_public_questions(set_id):
    """Get questions for a set without user progress (for guest users)"""
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

@app.route('/api/public/questions/mixed', methods=['GET'])
def get_public_mixed_questions():
    """Get random mixed questions without user progress (for guest users)"""
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

# ============================================================================
# AUTHENTICATED ENDPOINTS
# ============================================================================

@app.route('/api/upload-tsv', methods=['POST'])
@token_required
@limiter.limit("100 per hour")  # Allow batch uploads (20+ files), prevent extreme abuse
def upload_tsv():
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

@app.route('/api/question-sets', methods=['GET'])
@token_required
def get_question_sets():
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

@app.route('/api/question-sets/<int:set_id>/questions', methods=['GET'])
@token_required
def get_questions(set_id):
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
        return jsonify({'questions': questions, 'instructions': instructions})
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

        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Rename set error: {str(e)}")
        if conn:
            conn.rollback()
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

        return jsonify({'success': True, 'action': action, 'is_bookmarked': is_bookmarked})
    except Exception as e:
        logger.error(f"Toggle bookmark error: {str(e)}")
        if conn:
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            return_db(conn)

@app.route('/api/questions/mixed', methods=['GET'])
@token_required
def get_mixed_questions():
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
    
def cleanup_connection_pool():
    """FIX #7: Close connection pool on shutdown to prevent connection leaks"""
    global connection_pool
    if connection_pool:
        try:
            connection_pool.closeall()
            logger.info("Database connection pool closed successfully")
        except Exception as e:
            logger.error(f"Error closing connection pool: {str(e)}")

# FIX #7: Register cleanup handler for graceful shutdown
import atexit
import signal

atexit.register(cleanup_connection_pool)

# Also handle SIGTERM (common in containerized environments)
def signal_handler(signum, frame):
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    cleanup_connection_pool()
    exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)