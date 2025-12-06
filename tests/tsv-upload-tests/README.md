# TSV Upload Test Files

This directory contains comprehensive test files for validating the upload logic overhaul.

## Test Files Overview

### Essential Tests (Top Priority)

#### **TEST_3_with_instructions.tsv** ⭐⭐⭐
**Purpose:** Verify instruction extraction and storage
**Contains:** 5 questions + 2 instructions
**Expected Results:**
- ✅ 5/5 questions imported
- ✅ 2 instructions stored in database
- ✅ NO warnings
- ✅ ℹ️ button appears when practicing this set
- ✅ Modal shows both instructions as bullet points

**Database Check:**
```sql
SELECT * FROM set_instructions WHERE set_id = <your_set_id>;
```

---

#### **TEST_4_instructions_only.tsv** ⭐⭐⭐
**Purpose:** Verify rejection of instruction-only files
**Contains:** Only 3 instruction rows, no questions
**Expected Results:**
- ❌ Upload FAILS
- ❌ Error message: "File contains only instructions, no questions found. Please add questions with both questionText and answerText."

---

#### **TEST_5_incomplete_rows.tsv** ⭐⭐⭐
**Purpose:** Verify correct warning for data issues (not timeout)
**Contains:** 5 rows, but only 2 valid questions (Q1, Q4)
**Expected Results:**
- ✅ 2/2 questions imported
- ⚠️ Warning: "Some rows may be missing required fields (questionText AND answerText)"
- ⚠️ Should NOT mention timeout
- ⚠️ Icon should be ⚠️ not ⏱️

---

#### **TEST_2_with_empty_lines.tsv** ⭐⭐
**Purpose:** Verify no false warnings for empty lines
**Contains:** 3 questions with 5 empty lines scattered throughout
**Expected Results:**
- ✅ 3/3 questions imported
- ✅ NO warnings
- ✅ Processing time < 1 second

---

#### **TEST_6_markdown_instructions.tsv** ⭐⭐
**Purpose:** Verify markdown rendering in instructions
**Contains:** 2 questions + 3 instructions with **bold** and __italic__ formatting
**Expected Results:**
- ✅ 2/2 questions imported
- ✅ Click ℹ️ button → modal opens
- ✅ "**Regular**" renders as **bold**
- ✅ "__phonetic__" renders as _italic_
- ✅ "**Important**" renders as **bold**

---

### Additional Tests (Secondary Priority)

#### **TEST_1_normal_file.tsv**
**Purpose:** Baseline test - verify normal upload works
**Contains:** 3 questions, no instructions, no empty lines
**Expected Results:**
- ✅ 3/3 questions imported
- ✅ NO warnings
- ✅ NO ℹ️ button (no instructions)

---

#### **TEST_7_mixed_empty_and_instructions.tsv**
**Purpose:** Combined test - empty lines + instructions
**Contains:** 3 questions + 2 instructions + empty lines
**Expected Results:**
- ✅ 3/3 questions imported
- ✅ 2 instructions stored
- ✅ NO warnings
- ✅ ℹ️ button appears

---

#### **TEST_8_with_images.tsv**
**Purpose:** Verify images work with instructions
**Contains:** 3 questions with image URLs + 2 instructions
**Expected Results:**
- ✅ 3/3 questions imported
- ✅ 2 instructions stored
- ✅ Instructions mention images
- ✅ Markdown in instructions renders

---

#### **TEST_9_special_characters.tsv**
**Purpose:** Verify special character handling
**Contains:** 3 questions with special chars + 2 instructions with special chars
**Expected Results:**
- ✅ 3/3 questions imported
- ✅ Special characters stored correctly (>, <, &, ", ')
- ✅ Instructions display without HTML injection
- ✅ No XSS vulnerabilities

---

#### **TEST_10_long_instructions.tsv**
**Purpose:** Verify modal handles long content
**Contains:** 2 questions + 3 long instructions (one is 200+ chars)
**Expected Results:**
- ✅ 2/2 questions imported
- ✅ Modal is scrollable if content exceeds max height
- ✅ Layout doesn't break
- ✅ Close button still accessible

---

## Testing Workflow

### Quick Test (5 minutes)
1. Upload `TEST_3_with_instructions.tsv`
2. Upload `TEST_4_instructions_only.tsv` (should fail)
3. Upload `TEST_5_incomplete_rows.tsv`
4. Practice the set from TEST_3, click ℹ️ button

### Comprehensive Test (15 minutes)
Run all 10 tests in order and verify results match expectations.

---

## Validation Queries

After uploading TEST_3, run these queries to verify:

```sql
-- Check set was created
SELECT id, name, total_questions FROM question_sets
WHERE name LIKE '%TEST_3%'
ORDER BY created_at DESC LIMIT 1;

-- Check questions imported (should be 5)
SELECT COUNT(*) FROM questions WHERE set_id = <set_id_from_above>;

-- Check instructions stored (should be 2)
SELECT instruction_text, display_order
FROM set_instructions
WHERE set_id = <set_id_from_above>
ORDER BY display_order;

-- Expected output:
-- Row 1: "All are Regular Smashes" (display_order: 0)
-- Row 2: "No phonetic or container smashes. 2 LS called out" (display_order: 1)
```

---

## Frontend Testing Checklist

After uploading TEST_3 or TEST_6:

### Desktop Testing
- [ ] Navigate to practice view
- [ ] ℹ️ button visible in header (yellow circle with info icon)
- [ ] Button positioned to the left of "Another Random Set" button
- [ ] Click ℹ️ button → modal opens
- [ ] Modal has yellow background (#fff3cd) with gold border
- [ ] Instructions display as bullet list
- [ ] Click X button → modal closes
- [ ] Click outside modal (dark area) → modal closes
- [ ] Re-open modal → same instructions visible
- [ ] **If TEST_6:** Check markdown renders (bold/italic)

### Mobile Testing (Chrome DevTools)
- [ ] Resize to 375px width (iPhone SE)
- [ ] ℹ️ button doesn't overlap "Back" button
- [ ] ℹ️ button doesn't overlap "Random Set" button
- [ ] Modal opens full-width with 20px padding
- [ ] Modal is scrollable if instructions are long
- [ ] Close button (X) is easily tappable
- [ ] Closing modal returns to normal view

### Mixed Practice Mode Testing
- [ ] Upload TEST_3
- [ ] Start Mixed Practice (Bookmarks/Missed)
- [ ] Verify NO ℹ️ button visible
- [ ] Practice works normally

---

## Troubleshooting

### Upload fails with encoding error
**Issue:** File may have wrong encoding
**Fix:** Ensure files are UTF-8 encoded
```bash
file -I tests/tsv-upload-tests/*.tsv
# Should show: charset=utf-8
```

### Instructions not showing
**Possible causes:**
1. Database table not created → Restart backend to run migration
2. Frontend not updated → Clear browser cache, hard refresh (Cmd+Shift+R)
3. Check browser console for errors

### Modal doesn't open
**Check:**
1. Browser console for JavaScript errors
2. Network tab - verify `/api/question-sets/<id>/questions` returns `instructions` field
3. React DevTools - check `practice.setInstructions` has data

---

## Expected Processing Times

All tests should complete in < 2 seconds:
- TEST_1: ~0.1s
- TEST_2: ~0.15s (empty lines add minimal overhead)
- TEST_3: ~0.2s
- TEST_4: ~0.1s (fails immediately)
- TEST_5: ~0.15s
- TEST_6-10: ~0.2s

If any test takes > 5 seconds, investigate performance issues.

---

## Backward Compatibility Test

### Test with Old Sets (Already Uploaded)
1. Find a set uploaded BEFORE this code update
2. Practice that set
3. Verify:
   - ✅ Questions display correctly
   - ✅ NO ℹ️ button (no instructions stored)
   - ✅ No errors in console

This confirms backward compatibility is maintained.
