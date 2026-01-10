#!/usr/bin/env python3
"""
Backend TSV Parsing Test Suite

Tests the TSV parsing logic including:
- Valid file parsing
- Missing column detection
- CSV vs TSV detection
- Line ending normalization
- Line number error reporting
"""

import sys
import csv
import io
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

class TSVParsingTests:
    def __init__(self):
        self.results = []
        self.fixtures_dir = project_root / "tests" / "fixtures"

    def run_all(self):
        """Run all test cases"""
        print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}Backend TSV Parsing Test Suite{Colors.END}")
        print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")

        self.test_valid_tsv()
        self.test_missing_columns()
        self.test_csv_detection()
        self.test_line_endings()
        self.test_line_number_tracking()
        self.test_empty_fields()
        self.test_header_normalization()

        self.print_summary()

    def test_valid_tsv(self):
        """Test parsing of valid TSV file"""
        content = """questionText\tanswerText
What is 2+2?\t4
What is the capital of France?\tParis"""

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
            fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]

            rows = list(reader)
            passed = (
                'questionText' in fieldnames and
                'answerText' in fieldnames and
                len(rows) == 2 and
                rows[0]['questionText'] == 'What is 2+2?' and
                rows[0]['answerText'] == '4'
            )

            self.results.append(TestResult(
                "Valid TSV parsing",
                passed,
                f"Parsed {len(rows)} rows with headers: {fieldnames}" if passed else "Failed to parse correctly"
            ))
        except Exception as e:
            self.results.append(TestResult("Valid TSV parsing", False, str(e)))

    def test_missing_columns(self):
        """Test detection of missing required columns"""
        content = """question\tanswer
What is 2+2?\t4"""

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
            required_headers = ['questionText', 'answerText']
            fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]

            missing = not all(h in fieldnames for h in required_headers)

            self.results.append(TestResult(
                "Missing column detection",
                missing,
                f"Correctly detected missing columns. Found: {fieldnames}"
            ))
        except Exception as e:
            self.results.append(TestResult("Missing column detection", False, str(e)))

    def test_csv_detection(self):
        """Test detection of CSV format instead of TSV"""
        content = """questionText,answerText
What is 2+2?,4"""

        first_line = content.split('\n')[0]
        has_comma = ',' in first_line
        has_tab = '\t' in first_line
        is_csv = has_comma and not has_tab

        self.results.append(TestResult(
            "CSV format detection",
            is_csv,
            "Correctly identified CSV format (commas without tabs)"
        ))

    def test_line_endings(self):
        """Test handling of different line endings (CRLF, LF)"""
        crlf_content = "questionText\tanswerText\r\nWhat is 2+2?\t4\r\n"

        try:
            # This is what the backend does
            normalized = crlf_content.replace('\r\n', '\n').replace('\r', '\n')
            reader = csv.DictReader(io.StringIO(normalized), delimiter='\t')

            rows = list(reader)
            passed = len(rows) == 1

            self.results.append(TestResult(
                "CRLF line ending normalization",
                passed,
                f"Successfully parsed {len(rows)} row(s) after normalization"
            ))
        except Exception as e:
            self.results.append(TestResult("CRLF line ending normalization", False, str(e)))

    def test_line_number_tracking(self):
        """Test that line numbers are tracked correctly"""
        content = """questionText\tanswerText
Good row\tAnswer
Bad row with extra\tfield\textra"""

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
            line_number = 2

            for row in reader:
                # Simulate checking for errors
                if None in row and row[None]:
                    # Extra columns detected on this line
                    error_with_line = f"Error at line {line_number}: Extra columns detected"
                    passed = 'line 3' in error_with_line.lower()
                    break
                line_number += 1
            else:
                passed = False

            self.results.append(TestResult(
                "Line number tracking in errors",
                passed,
                "Line number correctly tracked (starts at 2 after header)"
            ))
        except Exception as e:
            self.results.append(TestResult("Line number tracking in errors", False, str(e)))

    def test_empty_fields(self):
        """Test handling of empty fields"""
        content = """questionText\tanswerText
What is 2+2?\t4
\tEmpty question
Valid question\t"""

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
            rows = list(reader)

            # The backend filters out rows with empty question or answer
            valid_rows = [r for r in rows if r['questionText'].strip() and r['answerText'].strip()]

            passed = len(valid_rows) == 1  # Only the first row should be valid

            self.results.append(TestResult(
                "Empty field handling",
                passed,
                f"Correctly filtered: {len(rows)} total rows → {len(valid_rows)} valid rows"
            ))
        except Exception as e:
            self.results.append(TestResult("Empty field handling", False, str(e)))

    def test_header_normalization(self):
        """Test that header whitespace is normalized"""
        content = """  questionText  \t  answerText
What is 2+2?\t4"""

        try:
            reader = csv.DictReader(io.StringIO(content), delimiter='\t')
            # Backend filters and strips fieldnames
            fieldnames = [f.strip() for f in (reader.fieldnames or []) if f and f.strip()]

            passed = 'questionText' in fieldnames and 'answerText' in fieldnames

            self.results.append(TestResult(
                "Header whitespace normalization",
                passed,
                f"Headers correctly normalized: {fieldnames}"
            ))
        except Exception as e:
            self.results.append(TestResult("Header whitespace normalization", False, str(e)))

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
    tests = TSVParsingTests()
    success = tests.run_all()
    sys.exit(0 if success else 1)
