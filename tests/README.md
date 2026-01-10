# Quiz App - Testing Suite

Comprehensive testing suite for the quiz app, covering backend parsing logic and frontend utility functions.

## 📁 Directory Structure

```
tests/
├── README.md                      # This file
├── run_all_tests.sh              # Master test runner
│
├── backend/
│   └── test_tsv_parsing.py       # TSV parsing tests
│
├── frontend/
│   └── test_image_utils.html     # Image URL handling tests
│
└── fixtures/
    ├── test-valid.tsv            # Valid TSV file
    ├── test-missing-columns.tsv  # Missing required columns
    ├── test-malformed.tsv        # Malformed TSV with extra tabs
    └── test-http-images.tsv      # TSV with HTTP image URLs
```

## 🚀 Quick Start

### Run All Tests

```bash
cd tests
./run_all_tests.sh
```

This will:
1. Run backend TSV parsing tests
2. Open frontend image utils tests in browser
3. Verify test fixtures exist
4. Display comprehensive summary

### Run Individual Test Suites

**Backend Tests:**
```bash
python3 tests/backend/test_tsv_parsing.py
```

**Frontend Tests:**
```bash
open tests/frontend/test_image_utils.html
# Or double-click the file in Finder
```

## 📊 Test Coverage

### Backend Tests (7 test cases)

Tests the TSV parsing logic in `backend/app.py`:

1. ✅ **Valid TSV Parsing** - Ensures properly formatted files parse correctly
2. ✅ **Missing Column Detection** - Detects when required headers are missing
3. ✅ **CSV Format Detection** - Identifies CSV files (comma-separated) vs TSV
4. ✅ **Line Ending Normalization** - Handles CRLF (Windows) and LF (Unix) line endings
5. ✅ **Line Number Tracking** - Error messages include line numbers for debugging
6. ✅ **Empty Field Handling** - Filters out rows with missing data
7. ✅ **Header Normalization** - Strips whitespace from column headers

### Frontend Tests (10 test cases)

Tests the image URL utilities in `frontend/src/utils.js`:

**ensureHttps() - 6 tests:**
1. ✅ HTTP URL upgrade to HTTPS
2. ✅ HTTPS URLs pass through unchanged
3. ✅ Relative URLs preserved
4. ✅ Protocol-relative URLs preserved
5. ✅ Empty string handling
6. ✅ Null handling

**getSafeImageUrl() - 4 tests:**
7. ✅ HTTP URLs upgraded to HTTPS
8. ✅ HTTPS URLs passed through
9. ✅ Null returns null
10. ✅ Empty string returns null

## 🛠️ Test Fixtures

### test-valid.tsv
```tsv
questionText	answerText
What is 2+2?	4
What is the capital of France?	Paris
```
**Purpose:** Verify normal TSV parsing works correctly

### test-missing-columns.tsv
```tsv
question	answer
What is 2+2?	4
```
**Purpose:** Test error detection for incorrect headers

### test-malformed.tsv
```tsv
questionText	answerText
What is 2+2?	4
This has a tab	in the middle	Extra column
```
**Purpose:** Test handling of embedded tabs and extra columns

### test-http-images.tsv
```tsv
questionText	answerText	imageUrl
What is shown?	A cat	http://example.com/cat.jpg
What is this?	A dog	https://example.com/dog.jpg
```
**Purpose:** Verify HTTP → HTTPS URL upgrades for images

## 📝 Adding New Tests

### Backend Tests

1. Add test method to `test_tsv_parsing.py`:
```python
def test_your_feature(self):
    """Test description"""
    content = """your\ttest\ndata\there"""

    try:
        # Your test logic
        passed = True
        self.results.append(TestResult(
            "Your test name",
            passed,
            "Details about what was tested"
        ))
    except Exception as e:
        self.results.append(TestResult("Your test name", False, str(e)))
```

2. Call it from `run_all()`:
```python
def run_all(self):
    # ... existing tests ...
    self.test_your_feature()
```

### Frontend Tests

Add to test cases array in `test_image_utils.html`:

```javascript
{
    name: 'Your test description',
    input: 'test input value',
    expected: 'expected output',
    func: functionToTest
}
```

### Test Fixtures

Add new `.tsv` file to `fixtures/` directory:

```bash
# Create fixture
echo -e "questionText\tanswerText\nQ1\tA1" > tests/fixtures/test-new.tsv

# Update run_all_tests.sh FIXTURES array if needed
```

## 🔍 Interpreting Results

### Backend Test Output

```
══════════════════════════════════════════════════════════════════════
Backend TSV Parsing Test Suite
══════════════════════════════════════════════════════════════════════

✓ PASS - Valid TSV parsing
       Parsed 2 rows with headers: ['questionText', 'answerText']

✓ PASS - Missing column detection
       Correctly detected missing columns. Found: ['question', 'answer']

Summary:
  Total:  7
  Passed: 7
  Failed: 0
  Rate:   100.0%

✓ All tests passed!
```

### Frontend Test Output

Opens in browser with:
- Visual test case results (green = pass, red = fail)
- Detailed input/expected/result for each test
- Summary statistics with pass rate
- Color-coded success/failure indicators

## 🚨 Troubleshooting

### Backend tests fail with ModuleNotFoundError

**Solution:** Run from project root with Python 3:
```bash
cd /path/to/quiz-app
python3 tests/backend/test_tsv_parsing.py
```

### Frontend tests don't open

**Solution:** Open manually:
```bash
# macOS
open tests/frontend/test_image_utils.html

# Linux
xdg-open tests/frontend/test_image_utils.html

# Windows
start tests/frontend/test_image_utils.html
```

### Permission denied on run_all_tests.sh

**Solution:** Make executable:
```bash
chmod +x tests/run_all_tests.sh
```

## 📋 Pre-Deployment Checklist

Before pushing to production:

- [ ] Run `./tests/run_all_tests.sh`
- [ ] Verify all backend tests pass (7/7)
- [ ] Verify all frontend tests pass (10/10)
- [ ] Check that all 4 fixtures are present
- [ ] Review any new test failures
- [ ] Update this README if tests were added

## 🔄 CI/CD Integration

To integrate with CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'

      - name: Run backend tests
        run: python3 tests/backend/test_tsv_parsing.py

      - name: Check fixtures
        run: |
          test -f tests/fixtures/test-valid.tsv
          test -f tests/fixtures/test-missing-columns.tsv
```

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Complete Documentation](../DOCS.md) - Full technical docs
- [Backend README](../backend/README.md) - Backend specifics
- [Frontend README](../frontend/README.md) - Frontend specifics

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests still pass
3. Add test fixtures if needed
4. Update this README with new test descriptions
5. Run full test suite before committing

## 📊 Test History

- **2025-12-04**: Initial test suite created
  - 7 backend tests for TSV parsing
  - 10 frontend tests for image URL handling
  - 4 test fixtures
  - Master test runner script

---

**Happy Testing! 🎉**
