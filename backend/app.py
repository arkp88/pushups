import os
import csv
import io
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this')
DATABASE_URL = os.getenv('DATABASE_URL')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

def get_db():
    """Get database connection"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def verify_supabase_token(token):
    """Verify Supabase JWT token"""
    try:
        # Supabase sends JWT tokens, decode and verify
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=['HS256'], audience='authenticated')
        return payload
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Verify Supabase token
            payload = verify_supabase_token(token)
            if not payload:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get or create user in our database
            conn = get_db()
            cur = conn.cursor()
            
            supabase_user_id = payload.get('sub')
            email = payload.get('email')
            
            # Check if user exists
            cur.execute('SELECT * FROM users WHERE supabase_user_id = %s', (supabase_user_id,))
            user = cur.fetchone()
            
            if not user:
                # Create new user
                username = email.split('@')[0]  # Simple username from email
                cur.execute(
                    'INSERT INTO users (supabase_user_id, email, username) VALUES (%s, %s, %s) RETURNING *',
                    (supabase_user_id, email, username)
                )
                user = cur.fetchone()
                conn.commit()
            
            cur.close()
            conn.close()
            
            # Add user to request context
            request.current_user = user
            
        except Exception as e:
            return jsonify({'error': f'Token validation failed: {str(e)}'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# ============= ROUTES =============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/upload-tsv', methods=['POST'])
@token_required
def upload_tsv():
    """Upload TSV file and parse questions"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    set_name = request.form.get('set_name', file.filename)
    set_description = request.form.get('description', '')
    
    if not file.filename.endswith('.tsv'):
        return jsonify({'error': 'File must be a TSV file'}), 400
    
    try:
        # Read TSV content
        content = file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content), delimiter='\t')
        
        conn = get_db()
        cur = conn.cursor()
        
        # Create question set
        cur.execute(
            'INSERT INTO question_sets (name, description, uploaded_by) VALUES (%s, %s, %s) RETURNING id',
            (set_name, set_description, request.current_user['id'])
        )
        set_id = cur.fetchone()['id']
        
        # Parse and insert questions
        question_count = 0
        for row in reader:
            round_no = row.get('roundNo', '').strip()
            question_no = row.get('questionNo', '').strip()
            question_text = row.get('questionText', '').strip()
            image_url = row.get('imageUrl', '').strip()
            answer_text = row.get('answerText', '').strip()
            
            # Extract image URL from markdown format if present
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
        
        # Update total questions count
        cur.execute(
            'UPDATE question_sets SET total_questions = %s WHERE id = %s',
            (question_count, set_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'set_id': set_id,
            'questions_imported': question_count,
            'set_name': set_name
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to parse TSV: {str(e)}'}), 500

@app.route('/api/question-sets', methods=['GET'])
@token_required
def get_question_sets():
    """Get all question sets"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT qs.*, u.username as uploaded_by_username,
                   COUNT(up.id) FILTER (WHERE up.user_id = %s AND up.attempted = true) as questions_attempted
            FROM question_sets qs
            LEFT JOIN users u ON qs.uploaded_by = u.id
            LEFT JOIN questions q ON q.set_id = qs.id
            LEFT JOIN user_progress up ON up.question_id = q.id
            GROUP BY qs.id, u.username
            ORDER BY qs.created_at DESC
        ''', (request.current_user['id'],))
        
        sets = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({'sets': sets})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-sets/<int:set_id>/questions', methods=['GET'])
@token_required
def get_questions(set_id):
    """Get all questions for a set with user progress"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT q.*,
                   up.attempted, up.correct, up.attempt_count, up.last_attempted,
                   mq.id IS NOT NULL as is_missed
            FROM questions q
            LEFT JOIN user_progress up ON up.question_id = q.id AND up.user_id = %s
            LEFT JOIN missed_questions mq ON mq.question_id = q.id AND mq.user_id = %s
            WHERE q.set_id = %s
            ORDER BY q.id
        ''', (request.current_user['id'], request.current_user['id'], set_id))
        
        questions = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({'questions': questions})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/<int:question_id>/progress', methods=['POST'])
@token_required
def update_progress(question_id):
    """Update user progress for a question"""
    try:
        data = request.json
        attempted = data.get('attempted', True)
        correct = data.get('correct', None)
        
        conn = get_db()
        cur = conn.cursor()
        
        # Upsert progress
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
        conn.close()
        
        return jsonify({'success': True, 'progress': progress})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/<int:question_id>/mark-missed', methods=['POST'])
@token_required
def mark_missed(question_id):
    """Mark a question as missed for Anki export"""
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
        conn.close()
        
        return jsonify({'success': True, 'missed': result})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/<int:question_id>/unmark-missed', methods=['POST'])
@token_required
def unmark_missed(question_id):
    """Remove a question from missed list"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute(
            'DELETE FROM missed_questions WHERE user_id = %s AND question_id = %s',
            (request.current_user['id'], question_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/missed-questions', methods=['GET'])
@token_required
def get_missed_questions():
    """Get all missed questions for export"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute('''
            SELECT q.*, mq.added_at, qs.name as set_name
            FROM missed_questions mq
            JOIN questions q ON mq.question_id = q.id
            JOIN question_sets qs ON q.set_id = qs.id
            WHERE mq.user_id = %s AND mq.exported_to_anki = false
            ORDER BY mq.added_at DESC
        ''', (request.current_user['id'],))
        
        questions = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({'missed_questions': questions})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    """Get user statistics"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Total questions
        cur.execute('SELECT COUNT(*) as total FROM questions')
        total_questions = cur.fetchone()['total']
        
        # Questions attempted
        cur.execute('''
            SELECT COUNT(*) as attempted 
            FROM user_progress 
            WHERE user_id = %s AND attempted = true
        ''', (request.current_user['id'],))
        attempted = cur.fetchone()['attempted']
        
        # Correct answers
        cur.execute('''
            SELECT COUNT(*) as correct 
            FROM user_progress 
            WHERE user_id = %s AND correct = true
        ''', (request.current_user['id'],))
        correct = cur.fetchone()['correct']
        
        # Missed questions
        cur.execute('''
            SELECT COUNT(*) as missed 
            FROM missed_questions 
            WHERE user_id = %s
        ''', (request.current_user['id'],))
        missed = cur.fetchone()['missed']
        
        cur.close()
        conn.close()
        
        return jsonify({
            'total_questions': total_questions,
            'attempted': attempted,
            'correct': correct,
            'missed': missed,
            'accuracy': round((correct / attempted * 100) if attempted > 0 else 0, 1)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
