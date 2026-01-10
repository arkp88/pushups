# Wake Detection Testing Guide

## Overview
This guide explains how to test the backend wake detection feature locally, since your local backend doesn't naturally have the "sleep/wake" behavior of Render's free tier.

## What Should Happen

### Expected Behavior (Production on Render)
1. User visits site after backend has been idle for 15+ minutes
2. Backend takes 30-40 seconds to wake up from sleep
3. During this time:
   - Frontend shows "Loading your pushups..." screen
   - After 8 seconds, wake notification appears: "⏳ Server is waking up from sleep..."
   - Once backend wakes, data loads and view renders

### Local Testing Challenge
Your local backend doesn't sleep, so requests complete in < 1 second. This makes it hard to test the wake detection.

## Testing Methods

### Method 1: Add Artificial Delay (Recommended)

This simulates the wake-up delay by adding a 10-second pause to all API requests.

#### Steps:

1. **Edit backend/app.py** - Add these two lines near the top (after app creation, before route registration):

```python
# At the top with other imports
import sys
sys.path.insert(0, 'tests/backend')
from test_wake_delay import add_wake_delay

# After creating app (after line: app = Flask(__name__))
# Before registering blueprints
add_wake_delay(app)  # REMOVE THIS WHEN DONE TESTING
```

2. **Restart the backend**:
```bash
cd /Users/raouf/Downloads/quiz-app/backend
pkill -f "python.*app.py"
python3 app.py
```

3. **Test in browser**:
   - Open http://localhost:3000
   - Refresh the page (Cmd+R)
   - **Expected behavior:**
     - ✅ See "Loading your pushups..." screen immediately
     - ✅ After 8 seconds, wake notification appears on top
     - ✅ After 10 seconds total, data loads and view renders
     - ✅ Wake notification disappears

4. **Remove the delay when done**:
   - Delete or comment out the two lines you added to app.py
   - Restart backend

### Method 2: Stop and Restart Backend Manually

This simulates the backend being completely offline.

#### Steps:

1. **Run the test script**:
```bash
/tmp/test_wake_detection.sh
```

This will stop your backend.

2. **Test in browser**:
   - Refresh http://localhost:3000
   - You'll see "Loading your pushups..." screen
   - After 8 seconds, wake notification should appear
   - Requests will fail (since backend is down)

3. **Restart backend**:
```bash
cd /Users/raouf/Downloads/quiz-app/backend
python3 app.py
```

4. **Refresh browser again** to see successful load

### Method 3: Browser DevTools Network Throttling

You can use Chrome/Firefox DevTools to slow down network requests.

#### Steps:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Set throttling** to "Slow 3G" or custom (add 8000ms latency)
4. **Refresh page**
5. **Expected:** Loading screen appears, then wake notification after 8 seconds

## What to Verify

### ✅ Checklist

- [ ] Loading screen appears immediately on page load
- [ ] Loading screen shows pulsing 💪 emoji
- [ ] Loading screen shows "Loading your pushups..." text
- [ ] After 8 seconds of waiting, wake notification appears
- [ ] Wake notification says "⏳ Server is waking up from sleep..."
- [ ] Wake notification appears OVER the loading screen (not covering content)
- [ ] Once data loads, loading screen disappears
- [ ] Wake notification disappears once request completes
- [ ] Home view renders with data

### ❌ What Should NOT Happen

- [ ] Content flashing before loading screen
- [ ] Wake notification covering actual question sets
- [ ] Multiple wake notifications stacking
- [ ] Wake notification appearing on fast requests (< 8 seconds)

## Testing Different Scenarios

### Scenario 1: Fast Request (< 8 seconds)
- **Setup:** Normal local backend (no delay)
- **Expected:** Loading screen briefly, NO wake notification, immediate data load
- **Result:** ✅ Should be smooth, no notification

### Scenario 2: Slow Request (8-15 seconds)
- **Setup:** Add 10s delay via Method 1
- **Expected:** Loading screen → wake notification at 8s → data loads at 10s
- **Result:** ✅ Wake notification should appear and disappear

### Scenario 3: Very Slow Request (30+ seconds)
- **Setup:** Add 35s delay (change `time.sleep(10)` to `time.sleep(35)` in test_wake_delay.py)
- **Expected:** Loading screen → wake notification at 8s → notification stays visible for 27 more seconds
- **Result:** ✅ Simulates real Render wake-up

## Cleanup

**IMPORTANT:** Remember to remove testing code when done!

1. Remove `test_wake_delay` import and call from app.py
2. Restart backend normally
3. Verify normal fast loading works

## Files Modified for Testing

- `tests/backend/test_wake_delay.py` - Testing helper (can keep, just don't import it)
- `backend/app.py` - **TEMPORARY changes** (must remove!)

## Production Verification

Once deployed to Render:
1. Wait 15+ minutes after last request
2. Visit your production URL
3. Should see loading screen → wake notification → data loads
4. Second visit (within 15 min) should be fast with no notification
