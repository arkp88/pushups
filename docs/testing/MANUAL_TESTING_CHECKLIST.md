# Manual Testing Checklist - Post Refactoring

## ✅ Automated Tests - PASSING

- **TSV Parsing Tests**: 7/7 passing (100%)
- **App Structure**: 6 blueprints, 20 routes registered correctly
- **Imports**: All modules load without errors

---

## 🧪 Manual Testing Required

Since the refactoring changed the internal structure but not the API, you should test the main user workflows to ensure everything still works end-to-end.

### Priority 1: Critical Workflows (Must Test)

#### 1. Upload TSV File ⭐⭐⭐
**Route**: `POST /api/upload-tsv`
**Steps**:
1. Start the backend: `cd backend && python3 app.py`
2. Start the frontend: `cd frontend && npm start`
3. Login to the app
4. Click "Upload" or "Add Set"
5. Select a .tsv file from your computer
6. Upload it
7. **Expected**: File uploads successfully, questions appear in the set

**Why**: Tests the `sets.py` blueprint and `tsv_parser.py` service integration

---

#### 2. Practice Questions ⭐⭐⭐
**Route**: `GET /api/question-sets/<id>/questions`
**Steps**:
1. Click on a question set
2. Start practicing questions
3. Answer some questions (mark correct/wrong)
4. **Expected**: Questions load, progress is tracked

**Why**: Tests the `questions.py` blueprint and progress tracking

---

#### 3. View Statistics ⭐⭐⭐
**Route**: `GET /api/stats`
**Steps**:
1. Click on "Stats" or "Dashboard"
2. View your statistics
3. **Expected**: Shows total questions, attempted, correct, accuracy percentage

**Why**: Tests the `stats.py` blueprint and aggregation queries

---

### Priority 2: Important Features (Should Test)

#### 4. Guest Mode ⭐⭐
**Routes**: `GET /api/public/*`
**Steps**:
1. Open app in incognito/private browsing
2. Browse question sets without logging in
3. Try practicing questions
4. **Expected**: Can browse and practice without authentication

**Why**: Tests the `public.py` blueprint (unauthenticated access)

---

#### 5. Google Drive Import ⭐⭐
**Route**: `POST /api/drive/import`
**Steps**:
1. Click "Import from Google Drive"
2. Select a folder
3. Choose files to import
4. **Expected**: Files import successfully

**Why**: Tests the `drive.py` blueprint and external API integration

---

#### 6. Bookmark Questions ⭐⭐
**Route**: `POST /api/questions/<id>/bookmark`
**Steps**:
1. While practicing, bookmark a question
2. Go to "Bookmarks" or filter by bookmarks
3. **Expected**: Bookmarked questions appear in the list

**Why**: Tests bookmark functionality in `questions.py`

---

#### 7. Mark Missed Questions ⭐⭐
**Routes**:
- `POST /api/questions/<id>/mark-missed`
- `GET /api/missed-questions`

**Steps**:
1. Mark a question as "missed" during practice
2. Go to "Missed Questions" view
3. **Expected**: Marked questions appear in missed list

**Why**: Tests missed questions workflow (`questions.py` + `stats.py`)

---

### Priority 3: Edge Cases (Nice to Test)

#### 8. Rename Question Set ⭐
**Route**: `PUT /api/question-sets/<id>/rename`
**Steps**:
1. Find a question set
2. Click rename/edit
3. Change the name
4. **Expected**: Name updates successfully

**Why**: Tests authorization and update functionality

---

#### 9. Delete Question Set ⭐
**Route**: `DELETE /api/question-sets/<id>`
**Steps**:
1. Delete a test question set
2. Verify it's removed from the list
3. **Expected**: Set is soft-deleted (is_deleted=true)

**Why**: Tests deletion and authorization

---

#### 10. Health Check ⭐
**Route**: `GET /health`
**Steps**:
1. Open browser to `http://localhost:5000/health`
2. **Expected**: Returns `{"status": "healthy", "timestamp": "..."}`

**Why**: Tests the `health.py` blueprint

---

## 🔍 What to Look For

### Signs Everything Works:
- ✅ No console errors in browser or backend
- ✅ All API calls return 200 status codes
- ✅ Data saves and loads correctly
- ✅ Authentication works (JWT tokens)
- ✅ CORS doesn't block requests from frontend

### Red Flags (Stop and Report):
- ❌ 500 errors in backend logs
- ❌ 404 errors for routes that should exist
- ❌ Data doesn't save (check database connection)
- ❌ CORS errors in browser console
- ❌ "Module not found" errors in backend logs

---

## 🚀 Quick Start Testing Script

```bash
# Terminal 1 - Start Backend
cd /Users/raouf/Downloads/quiz-app/backend
python3 app.py

# You should see:
# - "CORS allowed origins: ['http://localhost:3000', ...]"
# - "All route blueprints registered successfully"
# - "Running on http://0.0.0.0:5000"

# Terminal 2 - Start Frontend
cd /Users/raouf/Downloads/quiz-app/frontend
npm start

# Test basic flow:
# 1. Login
# 2. Upload a TSV file
# 3. Practice a few questions
# 4. Check stats
```

---

## 📊 Test Results Template

Copy this and fill in your results:

```
✅ Upload TSV: PASS / FAIL
   Notes: ___________________________________

✅ Practice Questions: PASS / FAIL
   Notes: ___________________________________

✅ View Statistics: PASS / FAIL
   Notes: ___________________________________

✅ Guest Mode: PASS / FAIL
   Notes: ___________________________________

✅ Google Drive Import: PASS / FAIL / SKIPPED
   Notes: ___________________________________

✅ Bookmark Questions: PASS / FAIL
   Notes: ___________________________________

✅ Mark Missed: PASS / FAIL
   Notes: ___________________________________

✅ Rename Set: PASS / FAIL
   Notes: ___________________________________

✅ Delete Set: PASS / FAIL
   Notes: ___________________________________

✅ Health Check: PASS / FAIL
   Notes: ___________________________________
```

---

## 🐛 If Something Breaks

### Check Backend Logs
Look for errors in the terminal where you ran `python3 app.py`

### Check Frontend Console
Open browser DevTools (F12) and check Console tab for errors

### Check Network Tab
In DevTools Network tab, look for failed API calls (red status codes)

### Revert to Original (If Needed)
```bash
cd /Users/raouf/Downloads/quiz-app/backend
mv app.py app.py.refactored
mv app.py.backup app.py
# Restart backend
python3 app.py
```

---

## ✨ Expected Behavior Summary

All functionality should work **exactly the same** as before. The refactoring only changed:
- **Internal code organization** (not API endpoints)
- **File structure** (not functionality)
- **Import paths** (not external behavior)

If any feature works differently than before the refactoring, that's a bug and should be investigated.

---

**Status**: Ready for manual testing
**Time Estimate**: 15-20 minutes to test all critical workflows
**Confidence Level**: High (all automated tests passing, code structure verified)
