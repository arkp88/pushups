#!/bin/bash

# TSV Upload Test Runner
# This script helps you test the upload functionality systematically

echo "=================================================="
echo "TSV Upload Logic - Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test directory
TEST_DIR="$(dirname "$0")"

echo "Test files location: $TEST_DIR"
echo ""

# Function to display test info
show_test() {
    local test_num=$1
    local test_file=$2
    local description=$3
    local expected=$4

    echo "=================================================="
    echo -e "${YELLOW}TEST $test_num: $test_file${NC}"
    echo "=================================================="
    echo "Description: $description"
    echo ""
    echo "Expected Results:"
    echo "$expected"
    echo ""
    echo "File location: $TEST_DIR/$test_file"
    echo ""
    echo -e "${GREEN}Action: Upload this file through your web interface${NC}"
    echo ""
    read -p "Press Enter when you've completed this test..."
    echo ""
}

# Run tests
echo "This script will guide you through each test."
echo "You'll need to upload each file manually through the web interface."
echo ""
read -p "Press Enter to start..."
echo ""

# Test 1
show_test "1" "TEST_1_normal_file.tsv" \
    "Baseline test - normal upload" \
    "✅ 3/3 questions imported
✅ NO warnings
✅ NO ℹ️ button (no instructions)"

# Test 2
show_test "2" "TEST_2_with_empty_lines.tsv" \
    "File with empty lines - should NOT trigger warnings" \
    "✅ 3/3 questions imported
✅ NO warnings
✅ Processing time < 1 second
⚠️  OLD BEHAVIOR: Would show '3 of 8 questions imported' warning"

# Test 3 (CRITICAL)
show_test "3" "TEST_3_with_instructions.tsv" \
    "File with instructions - CRITICAL TEST" \
    "✅ 5/5 questions imported
✅ 2 instructions stored in database
✅ NO warnings
✅ ℹ️ button appears when practicing this set
✅ Modal shows both instructions as bullet points

Database Check (run in psql):
SELECT * FROM set_instructions WHERE set_id = (SELECT id FROM question_sets ORDER BY created_at DESC LIMIT 1);"

# Test 4 (CRITICAL)
show_test "4" "TEST_4_instructions_only.tsv" \
    "Instructions only - should REJECT upload" \
    "❌ Upload FAILS
❌ Error: 'File contains only instructions, no questions found...'
⚠️  This is EXPECTED behavior - the upload should fail"

# Test 5 (CRITICAL)
show_test "5" "TEST_5_incomplete_rows.tsv" \
    "Incomplete rows - data issue warning (not timeout)" \
    "✅ 2/2 questions imported (only Q1 and Q4 are complete)
⚠️  Warning: 'Some rows may be missing required fields'
⚠️  Should NOT mention timeout
⚠️  Icon should be ⚠️ not ⏱️"

# Test 6
show_test "6" "TEST_6_markdown_instructions.tsv" \
    "Markdown formatting in instructions" \
    "✅ 2/2 questions imported
✅ Click ℹ️ button → modal opens
✅ '**Regular**' renders as bold
✅ '__phonetic__' renders as italic"

# Test 7
show_test "7" "TEST_7_mixed_empty_and_instructions.tsv" \
    "Empty lines + instructions combined" \
    "✅ 3/3 questions imported
✅ 2 instructions stored
✅ NO warnings"

# Test 8
show_test "8" "TEST_8_with_images.tsv" \
    "Questions with images + instructions" \
    "✅ 3/3 questions imported
✅ 2 instructions stored
✅ Image URLs preserved correctly"

# Test 9
show_test "9" "TEST_9_special_characters.tsv" \
    "Special characters handling" \
    "✅ 3/3 questions imported
✅ Special characters (>, <, &, etc.) stored correctly
✅ No HTML injection in instructions display"

# Test 10
show_test "10" "TEST_10_long_instructions.tsv" \
    "Long instructions - modal scrollability" \
    "✅ 2/2 questions imported
✅ Modal is scrollable for long content
✅ Layout doesn't break
✅ Close button accessible"

echo "=================================================="
echo -e "${GREEN}All tests completed!${NC}"
echo "=================================================="
echo ""
echo "Summary of critical tests:"
echo "  • TEST 2: No false warnings for empty lines"
echo "  • TEST 3: Instructions stored and displayed"
echo "  • TEST 4: Instructions-only files rejected"
echo "  • TEST 5: Correct warning for data issues"
echo ""
echo "Next steps:"
echo "  1. Verify all critical tests passed"
echo "  2. Test frontend (ℹ️ button, modal, markdown)"
echo "  3. Test on mobile view"
echo "  4. Test mixed practice mode (no ℹ️ button)"
echo ""
