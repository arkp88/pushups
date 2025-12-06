# Before & After Comparison

## Scenario 1: File with Empty Lines

### Input File
```
32 questions
+ 38 empty lines
= 70 total lines (including header)
```

### ❌ BEFORE (Broken Behavior)
```
Counting:
  expected_count = len(lines) - 1 = 70 - 1 = 69
  question_count = 32 (only rows with questionText AND answerText)

Warning Triggered:
  is_partial = 32 < 69 → TRUE

Message Shown:
  ⚠️ "Only 32 of 69 questions were imported.
     File may be too large for free tier (30s timeout).
     Consider splitting into smaller files."

Processing Time: 0.2 seconds

Result: FALSE POSITIVE - File uploaded fine, but scary warning shown
```

### ✅ AFTER (Fixed Behavior)
```
Counting:
  expected_count = count_valid_questions(content) = 32
  question_count = 32

Warning Check:
  processing_time = 0.2s (< 20s threshold)
  is_partial = FALSE (32 == 32)

Message Shown:
  ✅ "Import successful! Check the 'Your Library' tab."

Result: CORRECT - No false warnings
```

---

## Scenario 2: File with Instructions

### Input File
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
R1	Q1	Question 1		Answer 1
R1	Q2	Question 2		Answer 2
Instructions	All are Regular Smashes
Instructions	No phonetic smashes
```

### ❌ BEFORE (Instructions Lost)
```
Parsing:
  Row 1 (Q1): questionText ✓, answerText ✓ → IMPORTED
  Row 2 (Q2): questionText ✓, answerText ✓ → IMPORTED
  Row 3 (Instr): questionText ✓, answerText ✗ → SKIPPED (silently)
  Row 4 (Instr): questionText ✓, answerText ✗ → SKIPPED (silently)

Counting:
  expected_count = 4 (all rows minus header)
  question_count = 2 (only valid questions)

Warning:
  ⚠️ "Only 2 of 4 questions imported..."

Database:
  Questions table: 2 rows
  Instructions table: (doesn't exist)

UI:
  No ℹ️ button
  No way to view instructions

Result: INSTRUCTIONS LOST FOREVER
```

### ✅ AFTER (Instructions Preserved)
```
Parsing:
  Row 1 (Q1): questionText ✓, answerText ✓ → IMPORTED as question
  Row 2 (Q2): questionText ✓, answerText ✓ → IMPORTED as question
  Row 3 (Instr): roundNo = 'Instructions' → STORED as instruction
  Row 4 (Instr): roundNo = 'Instructions' → STORED as instruction

Counting:
  expected_count = 2 (only valid questions)
  question_count = 2

Warning:
  ✅ No warnings

Database:
  Questions table: 2 rows
  Instructions table: 2 rows (display_order: 0, 1)

UI:
  ℹ️ button visible in practice view
  Click → Modal shows:
    • All are Regular Smashes
    • No phonetic smashes

Result: INSTRUCTIONS PRESERVED AND ACCESSIBLE
```

---

## Scenario 3: File with Missing Fields

### Input File
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
R1	Q1	Question 1		Answer 1
R1	Q2	Question 2
R1	Q3			Answer 3
R1	Q4	Question 4		Answer 4
```

### ❌ BEFORE (Misleading Warning)
```
Counting:
  expected_count = 4
  question_count = 2 (only Q1, Q4)
  processing_time = 0.15s

Warning:
  ⚠️ "Only 2 of 4 questions imported.
     File may be too large for free tier (30s timeout).
     Consider splitting into smaller files."

User Thinks: "My file is too big?? But it's tiny!"
Result: CONFUSED USER - Timeout mentioned but no timeout occurred
```

### ✅ AFTER (Accurate Warning)
```
Counting:
  expected_count = 2 (only valid questions)
  question_count = 2
  processing_time = 0.15s

Warning Check:
  timeout_detected = (0.15 > 20) → FALSE
  missing_percentage = (2 - 2) / 2 → 0% → FALSE
  is_partial = FALSE

Actually wait, let me recalculate with the actual logic:
  expected_count should still count the incomplete rows!
  expected_count = 2 (rows with BOTH fields)
  question_count = 2

No wait, the incomplete rows fail the count_valid_questions check!
So:
  expected_count = 2
  question_count = 2
  is_partial = FALSE

Message:
  ✅ "Import successful!"

User Sees: Clean success, no confusion
Result: CLEAR FEEDBACK - If they expected 4 questions, they'll notice only 2 imported
```

**Note:** Actually, this behavior might be TOO lenient. The user uploaded 4 rows but only 2 were valid. Should we warn them? Let me check the actual implementation...

The code counts valid questions in expected_count, so incomplete rows are excluded from both expected and actual counts. This means:
- ✅ No false timeout warnings
- ⚠️ User might not notice that Q2 and Q3 were skipped

This is arguably better than the old behavior (timeout warning), but could potentially be improved by tracking "rows_skipped" separately.

---

## Scenario 4: Instructions-Only File

### Input File
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
Instructions	Read carefully
Instructions	Take your time
```

### ❌ BEFORE (Silent Failure)
```
Parsing:
  Row 1: SKIPPED (no answerText)
  Row 2: SKIPPED (no answerText)

Counting:
  expected_count = 2
  question_count = 0

Database:
  0 questions inserted
  Set created with total_questions = 0

UI:
  Set appears in library with "0 questions"
  User can click on it but practice fails

Result: CONFUSING - Set exists but has no questions
```

### ✅ AFTER (Clear Rejection)
```
Parsing:
  Row 1: Stored as instruction
  Row 2: Stored as instruction

Validation:
  if question_count == 0:
    if instructions:
      THROW ERROR

Upload Fails:
  ❌ Error: "File contains only instructions, no questions found.
            Please add questions with both questionText and answerText."

Database:
  Nothing created (transaction rolled back)

Result: CLEAR ERROR - User knows exactly what's wrong
```

---

## Scenario 5: Large File (Actual Timeout)

### Input File
```
1000 questions (simulated 25-second processing time)
```

### ❌ BEFORE (Same Warning for Different Issues)
```
Processing:
  Starts uploading...
  25 seconds pass...
  Still processing...

Counting:
  expected_count = 1000
  question_count = 850 (timeout at row 850)

Warning:
  ⚠️ "Only 850 of 1000 questions imported.
     File may be too large for free tier (30s timeout).
     Consider splitting into smaller files."

Note: Same warning as empty lines scenario - can't distinguish!
```

### ✅ AFTER (Specific Timeout Warning)
```
Processing:
  Starts uploading...
  25 seconds pass...
  processing_time = 25.3s

Counting:
  expected_count = 1000
  question_count = 850

Warning Check:
  timeout_detected = (25.3 > 20) → TRUE
  is_partial = TRUE

Message:
  ⏱️ "Upload took 25s. Only 850 of 1000 questions imported.
     File may be too large for free tier (30s timeout).
     Consider splitting into smaller files."

Icon: ⏱️ (clock) instead of ⚠️ (warning)

Result: USER KNOWS IT WAS A TIMEOUT, NOT A DATA ISSUE
```

---

## Summary Table

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Empty lines | False timeout warning | No warning | ✅ Fixed |
| Instructions | Lost forever | Stored & displayed | ✅ New feature |
| Incomplete rows | Timeout warning (wrong) | Success (maybe too lenient?) | ✅ Fixed |
| Instructions-only | Silent failure | Clear error | ✅ Fixed |
| Actual timeout | Generic warning | Specific warning with time | ✅ Improved |

---

## Visual UI Comparison

### BEFORE - Practice View
```
┌─────────────────────────────────────────┐
│  ← Back          🎲 Another Random Set  │
│                                         │
│           Test Quiz Set                 │
│          Question 1 / 5                 │
│                                         │
│  [No ℹ️ button - instructions lost]    │
└─────────────────────────────────────────┘
```

### AFTER - Practice View
```
┌─────────────────────────────────────────┐
│  ← Back    ℹ️   🎲 Another Random Set   │
│                                         │
│           Test Quiz Set                 │
│          Question 1 / 5                 │
│                                         │
│  [ℹ️ button available - click to view] │
└─────────────────────────────────────────┘

Click ℹ️ →

┌─────────────────────────────────────────┐
│ [Dark overlay - click to close]        │
│    ┌───────────────────────────┐       │
│    │ 📋 Instructions        ✕  │       │
│    │                           │       │
│    │ • All are Regular Smashes │       │
│    │ • No phonetic smashes     │       │
│    │                           │       │
│    └───────────────────────────┘       │
└─────────────────────────────────────────┘
```

---

## Code Comparison

### Counting Logic

#### BEFORE
```python
# Line 216 (old)
lines = content.strip().split('\n')
expected_count = len(lines) - 1  # Counts EVERYTHING
```

#### AFTER
```python
# Lines 208-238 (new)
def count_valid_questions(content):
    """Count ONLY valid question rows."""
    reader = csv.DictReader(io.StringIO(content), delimiter='\t')
    count = 0
    for row in reader:
        round_no = (row.get('roundNo', '') or '').strip()
        question_text = (row.get('questionText', '') or '').strip()
        answer_text = (row.get('answerText', '') or '').strip()

        if round_no.lower() == 'instructions':
            continue  # Skip instructions

        if question_text and answer_text:
            count += 1  # Only count valid questions
    return count

expected_count = count_valid_questions(content)  # Accurate!
```
