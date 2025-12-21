#!/usr/bin/env python3
"""
Batch generate summaries for all question sets without summaries.

Usage:
    cd /Users/raouf/Downloads/quiz-app/backend
    python3 scripts/generate_all_summaries.py
"""
import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.database import get_db, return_db
from utils.summarize import generate_summary_safe
import time

def main():
    """Generate summaries for all sets missing them."""
    conn = get_db()
    cursor = conn.cursor()

    # Get all sets without summaries
    cursor.execute("""
        SELECT id, name
        FROM question_sets
        WHERE (summary IS NULL OR summary = '') AND is_deleted = false
        ORDER BY created_at DESC
    """)
    sets = cursor.fetchall()

    total = len(sets)
    print(f"\n{'='*60}")
    print(f"Found {total} question sets without summaries")
    print(f"{'='*60}\n")

    if total == 0:
        print("All sets already have summaries! ✓\n")
        return_db(conn)
        return

    success_count = 0
    fail_count = 0

    for idx, set_row in enumerate(sets, 1):
        set_id, set_name = set_row['id'], set_row['name']

        try:
            print(f"[{idx}/{total}] Processing: {set_name[:50]}...")

            # Get sample questions
            cursor.execute("""
                SELECT question_text FROM questions
                WHERE set_id = %s
                ORDER BY RANDOM()
                LIMIT 8
            """, (set_id,))

            questions = [{'questionText': row['question_text']} for row in cursor.fetchall()]

            if not questions:
                print(f"  ⚠ Skipped (no questions)\n")
                fail_count += 1
                continue

            # Generate summary
            summary = generate_summary_safe(set_name, questions, len(questions))

            if summary:
                # Update database
                cursor.execute(
                    "UPDATE question_sets SET summary = %s WHERE id = %s",
                    (summary, set_id)
                )
                conn.commit()

                print(f"  ✓ Generated: \"{summary}\"\n")
                success_count += 1
            else:
                print(f"  ✗ Failed to generate\n")
                fail_count += 1

            # Rate limiting (Gemini free tier: 15 req/min = 4 seconds between requests)
            if idx < total:
                time.sleep(4)

        except KeyboardInterrupt:
            print("\n\n⚠ Interrupted by user")
            break
        except Exception as e:
            print(f"  ✗ Error: {e}\n")
            fail_count += 1

    return_db(conn)

    print(f"\n{'='*60}")
    print(f"Summary Generation Complete")
    print(f"{'='*60}")
    print(f"Total:   {total}")
    print(f"Success: {success_count} ✓")
    print(f"Failed:  {fail_count} ✗")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()
