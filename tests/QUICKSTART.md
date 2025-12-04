# Testing Quick Start

## Run All Tests
```bash
cd tests
./run_all_tests.sh
```

## Run Individual Tests

**Backend:**
```bash
python3 tests/backend/test_tsv_parsing.py
```

**Frontend:**
```bash
open tests/frontend/test_image_utils.html
```

## What Gets Tested

✅ **7 Backend Tests** - TSV parsing, error handling, line numbers
✅ **10 Frontend Tests** - Image URL handling, HTTP→HTTPS upgrades
✅ **4 Test Fixtures** - Sample data files

## Expected Output

All tests should pass:
- Backend: `✓ All tests passed! (100%)`
- Frontend: Green checkmarks in browser
- Fixtures: All 4 files found

See [README.md](README.md) for detailed documentation.
