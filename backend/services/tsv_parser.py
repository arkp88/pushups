"""
TSV File Parsing Service

Handles parsing and saving TSV question files to the database.
Includes duplicate detection, instruction extraction, and batch processing.
"""
import csv
import io
import time
import hashlib
import logging

from config import (
    BATCH_INSERT_SIZE,
    TIMEOUT_THRESHOLD_SECONDS,
    PARTIAL_UPLOAD_MISSING_PERCENTAGE
)
from services.database import get_db, return_db

logger = logging.getLogger(__name__)


def count_valid_questions(content):
    """
    Count ONLY valid question rows (with both questionText AND answerText).
    Excludes: empty lines, header, instruction rows.

    Args:
        content (str): TSV file content

    Returns:
        int: Number of valid questions
    """
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
    """
    Parse TSV content and save to database.

    Features:
    - Duplicate detection via SHA-256 content hash
    - Instruction extraction and storage
    - Batch insertion for performance
    - Partial upload detection
    - Line number error reporting

    Args:
        content (str): TSV file content
        set_name (str): Name for the question set
        description (str): Description of the set
        user_id (int): User ID who is uploading
        tags (str): Comma-separated tags
        google_id (str): Google Drive file ID (if applicable)

    Returns:
        tuple: (set_id, question_count, expected_count, is_partial, processing_time)

    Raises:
        Exception: If parsing fails or validation errors occur
    """
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

        # 3. Normalize content
        content = content.replace('\r\n', '\n').replace('\r', '\n')

        # Remove BOM if present
        if content.startswith('\ufeff'):
            content = content[1:]

        # 4. Parse CSV
        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
        except csv.Error as e:
            raise Exception(f"CSV parsing error: {str(e)}. Ensure your file is properly formatted with tab separators.")

        required_headers = ['questionText', 'answerText']

        # Filter out empty column names
        fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]

        logger.info(f"TSV Headers detected: {fieldnames}")

        # 5. Validate headers
        if not fieldnames or not all(h in fieldnames for h in required_headers):
            if ',' in content.split('\n')[0] and '\t' not in content.split('\n')[0]:
                raise Exception("File appears to be CSV, not TSV. Please use tab-separated values.")
            raise Exception(f"Missing required columns: {required_headers}. Found: {fieldnames}")

        # 6. Insert New Set (Include content_hash)
        cur.execute(
            '''INSERT INTO question_sets
               (name, description, uploaded_by, tags, is_deleted, google_drive_id, content_hash)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               RETURNING id''',
            (set_name, description, user_id, tags, False, google_id, content_hash)
        )
        set_id = cur.fetchone()['id']

        # 7. Extract and save instructions BEFORE processing questions
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

        # 8. Parse questions with batch insertion
        question_count = 0
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

                    # Handle wrapped image URLs
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
                        if len(questions_batch) >= BATCH_INSERT_SIZE:
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

        # 9. Validate: Reject files with only instructions and no questions
        if question_count == 0:
            if instructions:
                raise Exception("File contains only instructions, no questions found. Please add questions with both questionText and answerText.")
            else:
                raise Exception("No valid questions found. Each question must have both questionText and answerText.")

        # 10. Update total question count
        cur.execute('UPDATE question_sets SET total_questions = %s WHERE id = %s', (question_count, set_id))
        conn.commit()

        # Calculate processing time
        processing_time = time.time() - start_time

        # 11. Smart partial detection - only flag as partial if:
        # 1. Processing took longer than threshold (indicating possible timeout), OR
        # 2. We imported significantly fewer questions than expected (>20% missing)
        is_partial = False
        timeout_detected = processing_time > TIMEOUT_THRESHOLD_SECONDS

        if timeout_detected:
            is_partial = True
        elif question_count > 0 and expected_count > 0:
            missing_percentage = (expected_count - question_count) / expected_count
            if missing_percentage > PARTIAL_UPLOAD_MISSING_PERCENTAGE:
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
