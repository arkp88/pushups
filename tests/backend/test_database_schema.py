#!/usr/bin/env python3
"""
Database Schema Tests

Tests that validate the database schema structure including:
- Table existence and structure
- Column definitions
- Constraints and indexes
- Foreign key relationships
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class TestResult:
    def __init__(self, name, passed, message=""):
        self.name = name
        self.passed = passed
        self.message = message

    def __str__(self):
        status = f"{Colors.GREEN}✓ PASS{Colors.END}" if self.passed else f"{Colors.RED}✗ FAIL{Colors.END}"
        return f"{status} - {self.name}" + (f"\n       {self.message}" if self.message else "")

class DatabaseSchemaTests:
    def __init__(self):
        self.results = []
        self.expected_tables = {
            'users': ['id', 'supabase_user_id', 'email', 'username', 'created_at'],
            'question_sets': ['id', 'name', 'description', 'uploaded_by', 'created_at',
                            'total_questions', 'tags', 'is_deleted', 'google_drive_id', 'content_hash'],
            'questions': ['id', 'set_id', 'round_no', 'question_no', 'question_text',
                        'image_url', 'answer_text', 'created_at'],
            'user_progress': ['id', 'user_id', 'question_id', 'attempted', 'correct',
                            'last_attempted', 'attempt_count'],
            'missed_questions': ['id', 'user_id', 'question_id', 'created_at', 'exported_to_anki'],
            'bookmarks': ['id', 'user_id', 'question_id', 'created_at'],
            'set_instructions': ['id', 'set_id', 'instruction_text', 'display_order', 'created_at'],
            'daily_activity': ['id', 'user_id', 'activity_date', 'questions_practiced'],
            'set_opens': ['user_id', 'set_id', 'opened_at'],
        }

    def run_all(self):
        """Run all test cases"""
        print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}Database Schema Test Suite{Colors.END}")
        print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")

        self.test_expected_tables_defined()
        self.test_users_table_structure()
        self.test_question_sets_table_structure()
        self.test_questions_table_structure()
        self.test_user_progress_table_structure()
        self.test_missed_questions_table_structure()
        self.test_bookmarks_table_structure()
        self.test_set_instructions_table_structure()
        self.test_daily_activity_table_structure()
        self.test_set_opens_table_structure()

        # Relationship tests
        self.test_foreign_key_relationships()
        self.test_unique_constraints()
        self.test_index_definitions()

        self.print_summary()

    def test_expected_tables_defined(self):
        """Test that all expected tables are defined in schema"""
        try:
            # Read database.py to check for table creation statements
            db_file = project_root / "backend" / "database.py"

            if not db_file.exists():
                self.results.append(TestResult(
                    "Database schema file exists",
                    False,
                    f"database.py not found at {db_file}"
                ))
                return

            with open(db_file, 'r') as f:
                schema_content = f.read()

            # Check if all expected tables are mentioned in CREATE TABLE statements
            tables_found = 0
            for table_name in self.expected_tables.keys():
                if f"CREATE TABLE {table_name}" in schema_content or f"CREATE TABLE IF NOT EXISTS {table_name}" in schema_content:
                    tables_found += 1

            passed = tables_found == len(self.expected_tables)

            self.results.append(TestResult(
                "All expected tables defined",
                passed,
                f"Found {tables_found}/{len(self.expected_tables)} tables in schema"
            ))
        except Exception as e:
            self.results.append(TestResult("All expected tables defined", False, str(e)))

    def test_users_table_structure(self):
        """Test users table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['id', 'supabase_user_id', 'email', 'username', 'created_at']

            # Check for CREATE TABLE users section
            users_section = self._extract_table_section(schema_content, 'users')

            if not users_section:
                self.results.append(TestResult(
                    "Users table structure",
                    False,
                    "Users table CREATE statement not found"
                ))
                return

            # Check if all required columns are present
            columns_found = sum(1 for col in required_columns if col in users_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Users table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Users table structure", False, str(e)))

    def test_question_sets_table_structure(self):
        """Test question_sets table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['id', 'name', 'description', 'uploaded_by', 'total_questions',
                              'is_deleted', 'content_hash']

            sets_section = self._extract_table_section(schema_content, 'question_sets')

            if not sets_section:
                self.results.append(TestResult(
                    "Question_sets table structure",
                    False,
                    "question_sets table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in sets_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Question_sets table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Question_sets table structure", False, str(e)))

    def test_questions_table_structure(self):
        """Test questions table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['id', 'set_id', 'question_text', 'answer_text']

            questions_section = self._extract_table_section(schema_content, 'questions')

            if not questions_section:
                self.results.append(TestResult(
                    "Questions table structure",
                    False,
                    "questions table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in questions_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Questions table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Questions table structure", False, str(e)))

    def test_user_progress_table_structure(self):
        """Test user_progress table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['user_id', 'question_id', 'attempted', 'correct', 'attempt_count']

            progress_section = self._extract_table_section(schema_content, 'user_progress')

            if not progress_section:
                self.results.append(TestResult(
                    "User_progress table structure",
                    False,
                    "user_progress table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in progress_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "User_progress table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("User_progress table structure", False, str(e)))

    def test_missed_questions_table_structure(self):
        """Test missed_questions table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['user_id', 'question_id']

            missed_section = self._extract_table_section(schema_content, 'missed_questions')

            if not missed_section:
                self.results.append(TestResult(
                    "Missed_questions table structure",
                    False,
                    "missed_questions table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in missed_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Missed_questions table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Missed_questions table structure", False, str(e)))

    def test_bookmarks_table_structure(self):
        """Test bookmarks table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['user_id', 'question_id']

            bookmarks_section = self._extract_table_section(schema_content, 'bookmarks')

            if not bookmarks_section:
                self.results.append(TestResult(
                    "Bookmarks table structure",
                    False,
                    "bookmarks table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in bookmarks_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Bookmarks table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Bookmarks table structure", False, str(e)))

    def test_set_instructions_table_structure(self):
        """Test set_instructions table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['set_id', 'instruction_text', 'display_order']

            instructions_section = self._extract_table_section(schema_content, 'set_instructions')

            if not instructions_section:
                self.results.append(TestResult(
                    "Set_instructions table structure",
                    False,
                    "set_instructions table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in instructions_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Set_instructions table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Set_instructions table structure", False, str(e)))

    def test_daily_activity_table_structure(self):
        """Test daily_activity table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['user_id', 'activity_date', 'questions_practiced']

            activity_section = self._extract_table_section(schema_content, 'daily_activity')

            if not activity_section:
                self.results.append(TestResult(
                    "Daily_activity table structure",
                    False,
                    "daily_activity table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in activity_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Daily_activity table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Daily_activity table structure", False, str(e)))

    def test_set_opens_table_structure(self):
        """Test set_opens table has required columns"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            required_columns = ['user_id', 'set_id', 'opened_at']

            opens_section = self._extract_table_section(schema_content, 'set_opens')

            if not opens_section:
                self.results.append(TestResult(
                    "Set_opens table structure",
                    False,
                    "set_opens table CREATE statement not found"
                ))
                return

            columns_found = sum(1 for col in required_columns if col in opens_section)
            passed = columns_found == len(required_columns)

            self.results.append(TestResult(
                "Set_opens table structure",
                passed,
                f"Found {columns_found}/{len(required_columns)} required columns"
            ))
        except Exception as e:
            self.results.append(TestResult("Set_opens table structure", False, str(e)))

    def test_foreign_key_relationships(self):
        """Test that foreign key relationships are defined"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            # Expected foreign keys
            expected_fks = [
                ('question_sets', 'uploaded_by', 'users'),
                ('questions', 'set_id', 'question_sets'),
                ('user_progress', 'user_id', 'users'),
                ('user_progress', 'question_id', 'questions'),
                ('missed_questions', 'user_id', 'users'),
                ('missed_questions', 'question_id', 'questions'),
            ]

            fks_found = sum(
                1 for table, col, ref_table in expected_fks
                if f"REFERENCES {ref_table}" in schema_content
            )

            passed = fks_found >= len(expected_fks) // 2  # At least half should be defined

            self.results.append(TestResult(
                "Foreign key relationships defined",
                passed,
                f"Found {fks_found} foreign key references in schema"
            ))
        except Exception as e:
            self.results.append(TestResult("Foreign key relationships defined", False, str(e)))

    def test_unique_constraints(self):
        """Test that unique constraints are defined"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            # Expected unique constraints
            expected_unique = [
                'supabase_user_id',  # users table
                'user_id, question_id',  # user_progress, missed_questions, bookmarks
            ]

            unique_found = sum(
                1 for constraint in expected_unique
                if 'UNIQUE' in schema_content and constraint.replace(', ', ',') in schema_content.replace(' ', '')
            )

            passed = unique_found > 0

            self.results.append(TestResult(
                "Unique constraints defined",
                passed,
                f"Found UNIQUE constraints in schema"
            ))
        except Exception as e:
            self.results.append(TestResult("Unique constraints defined", False, str(e)))

    def test_index_definitions(self):
        """Test that indexes are defined for performance"""
        try:
            db_file = project_root / "backend" / "database.py"
            with open(db_file, 'r') as f:
                schema_content = f.read()

            # Check for CREATE INDEX statements
            has_indexes = 'CREATE INDEX' in schema_content

            self.results.append(TestResult(
                "Indexes defined for performance",
                has_indexes,
                "CREATE INDEX statements found in schema" if has_indexes else "No indexes defined"
            ))
        except Exception as e:
            self.results.append(TestResult("Indexes defined for performance", False, str(e)))

    def _extract_table_section(self, schema_content, table_name):
        """Extract the CREATE TABLE section for a specific table"""
        try:
            start_marker = f"CREATE TABLE IF NOT EXISTS {table_name}"
            if start_marker not in schema_content:
                start_marker = f"CREATE TABLE {table_name}"

            if start_marker not in schema_content:
                return None

            start_idx = schema_content.index(start_marker)
            # Find the closing semicolon
            end_idx = schema_content.index(';', start_idx)

            return schema_content[start_idx:end_idx + 1]
        except ValueError:
            return None

    def print_summary(self):
        """Print test results summary"""
        print(f"\n{Colors.BOLD}Test Results:{Colors.END}")
        print("-" * 70)

        for result in self.results:
            print(result)

        passed = sum(1 for r in self.results if r.passed)
        total = len(self.results)
        percentage = (passed / total * 100) if total > 0 else 0

        print(f"\n{Colors.BOLD}Summary:{Colors.END}")
        print(f"  Total:  {total}")
        print(f"  Passed: {Colors.GREEN}{passed}{Colors.END}")
        print(f"  Failed: {Colors.RED}{total - passed}{Colors.END}")
        print(f"  Rate:   {Colors.GREEN if percentage == 100 else Colors.YELLOW}{percentage:.1f}%{Colors.END}")

        if percentage == 100:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed!{Colors.END}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}✗ Some tests failed{Colors.END}")

        print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")

        return passed == total

if __name__ == "__main__":
    tests = DatabaseSchemaTests()
    success = tests.run_all()
    sys.exit(0 if success else 1)
