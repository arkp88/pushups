# Debugging Authentication Issue

## Problem
After refactoring, logged-in user sees:
- All stats showing zero
- Buttons greyed out (like guest mode)
- User appears to not be authenticated

## ✅ Backend is Working Correctly

I verified:
- Backend starts successfully ✅
- Authentication decorator (`@token_required`) is imported correctly ✅
- Routes properly reject requests without tokens ✅
- Test request returns: `{"error": "Authentication required", "message": "Token is missing"}` ✅

**Conclusion**: The backend refactoring is correct. The issue is likely in how the frontend is calling the API.

---

## 🔍 Root Cause Analysis

Since the backend structure changed but the API endpoints didn't, this is likely a **CORS or request header** issue.

### Possible Causes:

1. **CORS Configuration Issue**
   - The refactored `app.py` might have different CORS settings
   - Credentials might not be included in requests

2. **Frontend API URL Issue**
   - Frontend might be calling old/incorrect URLs
   - Port might have changed (I noticed it's running on 5001 now, not 5000)

3. **Token Not Being Sent**
   - Frontend stores JWT token but isn't including it in requests
   - Authorization header not being set

---

## 🧪 How to Debug (Step by Step)

### Step 1: Check Browser DevTools

**Open Browser Console (F12) and check:**

1. **Console Tab** - Look for errors:
   ```
   ❌ Bad: CORS error, 401 Unauthorized, Network Error
   ✅ Good: No errors
   ```

2. **Network Tab** - Click on any API request (like `/api/stats`):
   - Check **Request Headers** section:
     ```
     Should see:
     Authorization: Bearer eyJhbGc...  (your JWT token)
     ```
   - Check **Response** section:
     ```
     ❌ If you see: {"error": "Authentication required"}
        → Token is not being sent

     ✅ If you see: {"total_questions": 123, ...}
        → Backend is working, frontend display issue
     ```

3. **Status Code**:
   - `401 Unauthorized` → Token missing or invalid
   - `200 OK` → Request succeeded
   - `0` or `(failed)` → CORS or network issue

---

### Step 2: Check Frontend API Configuration

**Look at your frontend code (likely in `src/services/api.js` or similar):**

Check the base URL:
```javascript
// Make sure this matches where backend is running
const API_URL = 'http://localhost:5001/api';  // Note: Port 5001, not 5000!
```

**Check if Authorization header is being set:**
```javascript
// Should look something like this:
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

### Step 3: Verify CORS Settings

**Check backend CORS configuration:**

In [backend/config.py](backend/config.py), verify:
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

In [backend/app.py](backend/app.py), verify:
```python
CORS(app, origins=CORS_ALLOWED_ORIGINS)
```

**If frontend runs on a different port, you need to add it!**

---

## 🔧 Quick Fixes to Try

### Fix 1: Check Backend Port

Backend might be running on port **5001** instead of 5000 (I saw this in the logs).

**Frontend fix** - Update API URL:
```javascript
// In your API configuration file
const API_URL = 'http://localhost:5001/api';  // Changed from 5000 to 5001
```

---

### Fix 2: Add CORS Support for Credentials

The refactored `app.py` might need to support credentials.

**Backend fix** - Update [app.py](backend/app.py):
```python
# Change this line:
CORS(app, origins=CORS_ALLOWED_ORIGINS)

# To this:
CORS(app, origins=CORS_ALLOWED_ORIGINS, supports_credentials=True)
```

**Frontend fix** - Ensure requests include credentials:
```javascript
// In your fetch/axios calls
fetch(url, {
  credentials: 'include',  // Add this
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

### Fix 3: Verify Environment Variables

Make sure `.env` file is loaded:

```bash
# Check if .env exists
cat /Users/raouf/Downloads/quiz-app/backend/.env

# Should contain:
DATABASE_URL=...
SUPABASE_JWT_SECRET=...
JWT_SECRET_KEY=...
```

---

## 🧪 Test Authentication Manually

### Test 1: Get a Valid Token

1. Login through the frontend
2. Open DevTools → Application/Storage → Local Storage
3. Look for your JWT token (might be stored as `token`, `auth_token`, `supabase.auth.token`, etc.)
4. Copy the token value

### Test 2: Make a Manual API Request

```bash
# Replace YOUR_TOKEN_HERE with the actual token
curl -X GET http://localhost:5001/api/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ✅ Should return your stats:
# {"total_questions": 123, "attempted": 45, ...}

# ❌ If you get:
# {"error": "Authentication required"}
# → Backend issue (JWT secret mismatch or token expired)

# ❌ If you get:
# {"error": "Invalid token"}
# → Token is wrong or JWT_SECRET mismatch
```

---

## 🎯 Most Likely Issues

Based on the symptoms, here are the most probable causes:

### 1. **Port Mismatch** (70% likely)
Backend is running on port 5001, but frontend is calling port 5000.

**Fix**: Update frontend API URL to `http://localhost:5001`

### 2. **CORS Credentials Not Enabled** (20% likely)
Refactored CORS doesn't support credentials.

**Fix**: Add `supports_credentials=True` to CORS config

### 3. **Token Not Being Sent** (10% likely)
Frontend authentication logic broke.

**Fix**: Check browser Network tab to see if Authorization header is present

---

## 📞 What to Report Back

Please check these and let me know:

1. **Browser Console Errors**:
   - Are there any red errors?
   - Any CORS-related messages?

2. **Network Tab**:
   - When you click on `/api/stats` request, do you see `Authorization: Bearer ...` in Request Headers?
   - What's the status code? (200, 401, 0, etc.)

3. **Backend Logs**:
   - What port is the backend running on? (5000 or 5001?)
   - Any error messages in the terminal?

4. **Frontend API URL**:
   - What URL is the frontend using to call the API?

---

## 🚀 Quick Diagnostic Commands

```bash
# 1. Check which port backend is running on
lsof -i :5000
lsof -i :5001

# 2. Kill any old backend instances
kill $(lsof -t -i:5000)
kill $(lsof -t -i:5001)

# 3. Restart backend on correct port
cd /Users/raouf/Downloads/quiz-app/backend
PORT=5000 python3 app.py

# 4. Test health endpoint
curl http://localhost:5000/health

# 5. Test authenticated endpoint (will fail, but shows backend works)
curl http://localhost:5000/api/stats
# Should return: {"error": "Authentication required", "message": "Token is missing"}
```

---

## ✅ When It's Working

You'll know authentication is fixed when:
- Browser Network tab shows `Authorization: Bearer ...` header
- API requests return `200 OK` status
- Stats show real data (not zeros)
- No CORS errors in console
- Buttons are not greyed out

---

**Next Step**: Check the items above and report what you find. The most likely fix is updating the frontend API URL to match the backend port.
