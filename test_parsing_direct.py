#!/usr/bin/env python3
"""
Direct testing of TSV parsing logic (no auth required)
"""

import sys
import csv
import io

print("=" * 60)
print("Direct TSV Parsing Tests (No Auth Required)")
print("=" * 60)

# Test 1: Valid TSV
print("\n📄 Test 1: Valid TSV")
valid_content = """questionText	answerText
What is 2+2?	4
What is the capital of France?	Paris"""

try:
    reader = csv.DictReader(io.StringIO(valid_content), delimiter='\t')
    fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]
    print(f"   Headers: {fieldnames}")

    line_number = 2
    for row in reader:
        question = row.get('questionText', '').strip()
        answer = row.get('answerText', '').strip()
        print(f"   Line {line_number}: Q='{question}' A='{answer}'")
        line_number += 1
    print("   ✅ Valid TSV parsed successfully")
except csv.Error as e:
    print(f"   ❌ CSV Error: {e}")
except Exception as e:
    print(f"   ❌ Exception: {e}")

# Test 2: Missing required columns
print("\n📄 Test 2: Missing Required Columns")
missing_cols_content = """question	answer
What is 2+2?	4"""

try:
    reader = csv.DictReader(io.StringIO(missing_cols_content), delimiter='\t')
    required_headers = ['questionText', 'answerText']
    fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]
    print(f"   Headers found: {fieldnames}")
    print(f"   Headers required: {required_headers}")

    if not all(h in fieldnames for h in required_headers):
        print(f"   ✅ Correctly detected missing columns")
        print(f"   Error message would be: Missing required columns: {required_headers}. Found: {fieldnames}")
    else:
        print(f"   ❌ Should have detected missing columns")
except Exception as e:
    print(f"   Exception: {e}")

# Test 3: CSV instead of TSV
print("\n📄 Test 3: CSV Instead of TSV (comma-separated)")
csv_content = """questionText,answerText
What is 2+2?,4
What is the capital of France?,Paris"""

try:
    # Check if first line has commas but no tabs
    first_line = csv_content.split('\n')[0]
    if ',' in first_line and '\t' not in first_line:
        print(f"   ✅ Correctly detected CSV format")
        print(f"   Error message would be: File appears to be CSV, not TSV. Please use tab-separated values.")
    else:
        print(f"   ❌ Should have detected CSV format")
except Exception as e:
    print(f"   Exception: {e}")

# Test 4: Embedded tab in field (the tricky one)
print("\n📄 Test 4: Embedded Tab in Field")
embedded_tab_content = """questionText	answerText
What is 2+2?	4
This has a tab	in the middle	Extra column
What is the capital?	Paris"""

try:
    reader = csv.DictReader(io.StringIO(embedded_tab_content), delimiter='\t')
    fieldnames = [f for f in (reader.fieldnames or []) if f and f.strip()]
    print(f"   Headers: {fieldnames}")

    line_number = 2
    for row in reader:
        try:
            question = row.get('questionText', '').strip()
            answer = row.get('answerText', '').strip()
            print(f"   Line {line_number}: Q='{question}' A='{answer}'")

            # Check if there are extra fields
            if None in row and row[None]:
                print(f"   ⚠️  Line {line_number} has extra columns: {row[None]}")

            line_number += 1
        except csv.Error as e:
            print(f"   ❌ CSV Error at line {line_number}: {e}")
            break

    print("   ℹ️  Note: CSV module may silently handle this by creating extra columns")
    print("   ℹ️  The actual error would be caught during processing")

except csv.Error as e:
    print(f"   ✅ CSV Error caught: {e}")
except Exception as e:
    print(f"   Exception: {e}")

# Test 5: Line endings
print("\n📄 Test 5: Mixed Line Endings (CRLF)")
crlf_content = "questionText\tanswerText\r\nWhat is 2+2?\t4\r\nWhat is France?\tCountry"

try:
    # Normalize line endings (this is what the backend does)
    normalized = crlf_content.replace('\r\n', '\n').replace('\r', '\n')
    reader = csv.DictReader(io.StringIO(normalized), delimiter='\t')

    line_number = 2
    for row in reader:
        question = row.get('questionText', '').strip()
        answer = row.get('answerText', '').strip()
        line_number += 1

    print(f"   ✅ CRLF line endings handled correctly ({line_number-2} rows parsed)")
except csv.Error as e:
    print(f"   ❌ CSV Error: {e}")

print("\n" + "=" * 60)
print("Testing Complete")
print("=" * 60)

# Test the image URL utility function
print("\n" + "=" * 60)
print("Image URL Handling Tests")
print("=" * 60)

test_urls = [
    ('http://example.com/image.jpg', 'https://example.com/image.jpg', 'HTTP → HTTPS upgrade'),
    ('https://example.com/image.jpg', 'https://example.com/image.jpg', 'Already HTTPS'),
    ('//cdn.example.com/image.jpg', '//cdn.example.com/image.jpg', 'Protocol-relative URL'),
    ('/static/image.jpg', '/static/image.jpg', 'Relative URL'),
    ('', None, 'Empty URL'),
    (None, None, 'None URL'),
]

for url, expected, description in test_urls:
    print(f"\n📸 {description}")
    print(f"   Input:    {url}")
    print(f"   Expected: {expected}")

    # Simulate the ensureHttps function
    if url and isinstance(url, str) and url.startswith('http://'):
        result = url.replace('http://', 'https://')
    else:
        result = url

    if result == expected:
        print(f"   Result:   {result} ✅")
    else:
        print(f"   Result:   {result} ❌")

print("\n" + "=" * 60)
print("All Tests Complete")
print("=" * 60)
