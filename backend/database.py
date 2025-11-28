import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_db_connection():
    """Get database connection from Supabase connection string"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL not set")
    return psycopg2.connect(database_url)

def init_db():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Users table (we'll rely on Supabase Auth, but store additional user data)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            supabase_user_id UUID UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Question sets table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS question_sets (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            uploaded_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_questions INTEGER DEFAULT 0
        )
    ''')
    
    # Questions table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            set_id INTEGER REFERENCES question_sets(id) ON DELETE CASCADE,
            round_no VARCHAR(100),
            question_no VARCHAR(100),
            question_text TEXT NOT NULL,
            image_url TEXT,
            answer_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User progress table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS user_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
            attempted BOOLEAN DEFAULT FALSE,
            correct BOOLEAN DEFAULT NULL,
            last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            attempt_count INTEGER DEFAULT 0,
            UNIQUE(user_id, question_id)
        )
    ''')
    
    # Missed questions for Anki export
    cur.execute('''
        CREATE TABLE IF NOT EXISTS missed_questions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            exported_to_anki BOOLEAN DEFAULT FALSE,
            UNIQUE(user_id, question_id)
        )
    ''')
    
    # Create indexes for better performance
    cur.execute('CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(set_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON user_progress(question_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_missed_questions_user_id ON missed_questions(user_id)')
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()
