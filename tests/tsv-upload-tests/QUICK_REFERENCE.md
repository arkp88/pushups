# Quick Test Reference Card

## 5-Minute Essential Tests

### 1. TEST_3_with_instructions.tsv ⭐
Upload → Should import 5 questions + store 2 instructions
Practice → Should see ℹ️ button → Click → Modal with instructions

### 2. TEST_4_instructions_only.tsv ⭐
Upload → Should FAIL with error message

### 3. TEST_5_incomplete_rows.tsv ⭐
Upload → Should import 2/2 with warning about "missing required fields" (NOT timeout)

---

## What Changed - At a Glance

### Before This Update ❌
```
File with 32 questions + 38 empty/instruction lines
└─ Expected: 70, Got: 32
   └─ Warning: "Only 32 of 70 questions imported (timeout)"
   └─ Instruction rows: Silently ignored
```

### After This Update ✅
```
File with 32 questions + 38 empty/instruction lines
└─ Expected: 32, Got: 32
   └─ No warnings
   └─ Instruction rows: Stored in database, displayed in modal
```

---

## File Structure Examples

### ✅ Valid File
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
R1	Q1	Question 1		Answer 1
R1	Q2	Question 2		Answer 2
Instructions	All are Regular Smashes
```
**Result:** 2 questions + 1 instruction

### ❌ Invalid File (Will Reject)
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
Instructions	Only instructions here
Instructions	No actual questions
```
**Result:** Error - "File contains only instructions..."

### ⚠️ Partial Import
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
R1	Q1	Question 1		Answer 1
R1	Q2	Question 2
R1	Q3	Question 3		Answer 3
```
**Result:** 2/2 imported (Q2 skipped - no answer)
**Warning:** "Some rows may be missing required fields"

---

## Database Verification

```sql
-- Check instructions were stored
SELECT si.instruction_text, si.display_order, qs.name
FROM set_instructions si
JOIN question_sets qs ON si.set_id = qs.id
WHERE qs.name LIKE '%TEST_3%'
ORDER BY si.display_order;

-- Expected output:
-- "All are Regular Smashes" | 0 | TEST_3_with_instructions
-- "No phonetic or container smashes. 2 LS called out" | 1 | TEST_3_with_instructions
```

---

## Troubleshooting Quick Guide

| Issue | Fix |
|-------|-----|
| ℹ️ button not showing | Clear cache, hard refresh (Cmd+Shift+R) |
| Instructions not in DB | Restart backend to run migration |
| Modal doesn't open | Check browser console for errors |
| Upload fails unexpectedly | Check file is UTF-8 encoded |
| Old sets broken | Should NOT happen - file a bug |

---

## Expected Warning Messages

### ⏱️ Timeout Warning (processing > 20s)
```
Upload took 25s. Only 100 of 150 questions were imported.
File may be too large for free tier (30s timeout).
Consider splitting into smaller files.
```

### ⚠️ Data Issue Warning
```
Only 2 of 5 questions were imported.
Some rows may be missing required fields (questionText AND answerText).
```

---

## Browser Console Checks

### Success (no errors)
```javascript
// Network tab → /api/upload-tsv
{
  success: true,
  set_id: 123,
  questions_imported: 5,
  expected_questions: 5,
  is_partial: false,
  processing_time: 0.15
}
```

### With Instructions
```javascript
// Network tab → /api/question-sets/123/questions
{
  questions: [...],
  instructions: [
    "All are Regular Smashes",
    "No phonetic or container smashes. 2 LS called out"
  ]
}
```

---

## Test Results Template

Copy this to track your testing:

```
✅ TEST_1: Normal file - 3/3 imported, no warnings
✅ TEST_2: Empty lines - 3/3 imported, no warnings
✅ TEST_3: With instructions - 5/5 imported, ℹ️ button works
✅ TEST_4: Instructions only - Upload rejected correctly
✅ TEST_5: Incomplete rows - 2/2 imported, data warning shown
✅ TEST_6: Markdown - Bold/italic rendering works
⬜ TEST_7: Mixed empty + instructions
⬜ TEST_8: With images
⬜ TEST_9: Special characters
⬜ TEST_10: Long instructions
```
