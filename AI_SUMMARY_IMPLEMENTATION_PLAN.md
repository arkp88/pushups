# AI-Generated Question Set Summaries - Implementation Plan

## Overview
Add AI-generated one-line summaries for question sets to make them more user-friendly, especially for casual users who may not understand technical filenames or format conventions.

## Problem Statement
- Question sets have inelegant, unclear names (e.g., long filenames, word-smash formats)
- Casual users struggle to understand what each set contains
- Need concise, clear descriptions visible in Browse Sets UI

## Solution: Hybrid AI Summary Generation
Use Google Gemini API to automatically generate summaries during upload, with manual generation option as fallback.

---

## Architecture Decision: Gemini API

**Selected:** Google Gemini 1.5 Flash

**Reasons:**
- ✅ Free tier: 15 requests/min, 1M tokens/day
- ✅ Cost: $0.075/$0.30 per 1M tokens (cheapest option)
- ✅ Already using Google ecosystem (Drive API)
- ✅ Fast and high quality for this use case
- ✅ Estimated cost for 100 sets: ~$0.005 (essentially free)

**Alternatives Considered:**
- OpenAI GPT-4o-mini: ~$0.01 for 100 sets (5x more expensive)
- Anthropic Claude Haiku: Similar pricing to OpenAI
- Manual curation: More work, no automation

---

## Implementation Approach: Hybrid

### Strategy
1. **Automatic during upload** - Backend attempts to generate summary immediately
2. **Graceful degradation** - If API fails, upload still succeeds (summary=NULL)
3. **On-demand generation** - Frontend shows "Generate Summary" button for sets without summaries

### Benefits
- ✅ Seamless UX - most sets get summaries automatically
- ✅ Resilient - API failures don't break uploads
- ✅ User control - can regenerate summaries if needed
- ✅ Backward compatible - existing sets can get summaries later

---

## Database Changes

### 1. Add Summary Column

```sql
-- Add summary column to question_sets table
ALTER TABLE question_sets ADD COLUMN summary TEXT;

-- Optional: Add index if searching by summary later
CREATE INDEX idx_question_sets_summary ON question_sets(summary);
```

**Migration Steps:**
1. Run SQL command in production database
2. Existing sets will have `summary = NULL`
3. No downtime required (nullable column)

---

## Backend Implementation

### File Structure
```
backend/
├── utils/
│   └── summarize.py          # NEW: Gemini API integration
├── routes/
│   ├── sets.py               # MODIFY: Add summary generation
│   └── public.py             # MODIFY: Include summary in responses
├── scripts/
│   └── generate_summaries.py # NEW: Batch generation script
└── .env                      # ADD: GOOGLE_AI_API_KEY
```

### 1. Create Gemini Integration Utility

**File:** `backend/utils/summarize.py`

```python
"""
AI-powered summary generation for question sets using Google Gemini API.
"""
import google.generativeai as genai
import os
from typing import List, Dict

# Configure Gemini API
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))

def generate_set_summary(set_name: str, sample_questions: List[Dict], num_questions: int) -> str:
    """
    Generate a concise one-line summary for a question set.

    Args:
        set_name: Name of the question set (often filename)
        sample_questions: List of 5-10 sample question dicts with 'questionText' key
        num_questions: Total number of questions in the set

    Returns:
        str: One-line summary (max 80 chars)

    Raises:
        Exception: If API call fails
    """
    try:
        # Prepare sample questions (limit to first 100 chars each)
        samples = "\n".join([
            f"- {q.get('questionText', '')[:100]}"
            for q in sample_questions[:8]
        ])

        # Construct prompt
        prompt = f"""Generate a brief, clear one-line summary (max 60 characters) for this quiz set.

Set name: {set_name}
Total questions: {num_questions}

Sample questions:
{samples}

Requirements:
- Maximum 60 characters
- Clear for casual users (no jargon)
- Describe the main topic/theme
- Engaging and concise
- No quotes or punctuation at the end

Good examples:
- "General knowledge trivia"
- "Bollywood movies and actors"
- "Australian geography and culture"
- "Shakespeare plays and quotes"
- "Mixed topics and random facts"
- "Science and nature questions"

Bad examples:
- "Questions about various things" (too vague)
- "Test your knowledge of Australian geography, wildlife, history, and culture" (too long)
- "tsv_wordsmash_format_australia" (technical filename)

Return ONLY the summary text, nothing else."""

        # Call Gemini API
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=30,
                temperature=0.3,  # Lower temperature for consistency
            )
        )

        # Extract and clean summary
        summary = response.text.strip()

        # Remove quotes if present
        summary = summary.strip('"\'')

        # Ensure max length
        if len(summary) > 80:
            summary = summary[:77] + "..."

        return summary

    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")


def generate_summary_safe(set_name: str, sample_questions: List[Dict], num_questions: int) -> str:
    """
    Safe wrapper that returns None instead of raising exceptions.
    Use this in production upload flow.
    """
    try:
        return generate_set_summary(set_name, sample_questions, num_questions)
    except Exception as e:
        print(f"Summary generation failed for '{set_name}': {e}")
        return None
```

### 2. Modify Upload Routes

**Files to modify:**
- `backend/routes/sets.py` - Main upload endpoint
- `backend/routes/public.py` - If upload happens here

**Changes needed:**

```python
# At top of file
from utils.summarize import generate_summary_safe

# In the upload function, AFTER creating set and inserting questions:

def upload_question_set(...):
    # ... existing upload logic ...
    # ... create question_set record ...
    # ... insert all questions ...

    # NEW: Auto-generate summary
    summary = None
    try:
        # Get sample questions for summary generation
        cursor.execute('''
            SELECT questionText FROM questions
            WHERE setId = ?
            ORDER BY RANDOM()
            LIMIT 8
        ''', (new_set_id,))

        sample_questions = [
            {'questionText': row[0]}
            for row in cursor.fetchall()
        ]

        if sample_questions:
            # Generate summary (safe - won't raise exceptions)
            summary = generate_summary_safe(
                set_name=uploaded_name,
                sample_questions=sample_questions,
                num_questions=total_questions
            )

            if summary:
                # Update set with generated summary
                cursor.execute(
                    'UPDATE question_sets SET summary = ? WHERE id = ?',
                    (summary, new_set_id)
                )
                conn.commit()
                print(f"✓ Generated summary for '{uploaded_name}': {summary}")
            else:
                print(f"⚠ Summary generation failed for '{uploaded_name}', set created without summary")

    except Exception as e:
        # Log but don't fail the upload
        print(f"⚠ Error during summary generation: {e}")

    # ... return response with set data ...
```

### 3. Add On-Demand Summary Generation Endpoint

**File:** `backend/routes/sets.py`

```python
@sets_bp.route('/<int:set_id>/generate-summary', methods=['POST'])
@require_auth
def generate_summary_endpoint(set_id):
    """
    Generate or regenerate AI summary for a specific question set.

    POST /api/sets/:id/generate-summary

    Returns:
        200: { "summary": "Generated summary text" }
        400: { "error": "No questions in set" }
        404: { "error": "Set not found" }
        500: { "error": "API error message" }
    """
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Verify set exists and get name
        cursor.execute(
            'SELECT name FROM question_sets WHERE id = ?',
            (set_id,)
        )
        set_row = cursor.fetchone()

        if not set_row:
            return_db(conn)
            return jsonify({'error': 'Set not found'}), 404

        set_name = set_row[0]

        # Get sample questions
        cursor.execute('''
            SELECT questionText, answerText
            FROM questions
            WHERE setId = ?
            ORDER BY RANDOM()
            LIMIT 8
        ''', (set_id,))

        sample_questions = [
            {'questionText': row[0], 'answerText': row[1]}
            for row in cursor.fetchall()
        ]

        if not sample_questions:
            return_db(conn)
            return jsonify({'error': 'No questions in set'}), 400

        # Generate summary
        summary = generate_set_summary(
            set_name=set_name,
            sample_questions=sample_questions,
            num_questions=len(sample_questions)
        )

        # Update database
        cursor.execute(
            'UPDATE question_sets SET summary = ? WHERE id = ?',
            (summary, set_id)
        )
        conn.commit()
        return_db(conn)

        return jsonify({'summary': summary}), 200

    except Exception as e:
        if 'conn' in locals():
            return_db(conn)
        return jsonify({'error': str(e)}), 500
```

### 4. Include Summary in API Responses

**Modify all endpoints that return question sets:**

```python
# In routes/public.py or routes/sets.py
# When fetching question sets, include summary column:

cursor.execute('''
    SELECT
        id,
        name,
        created_at,
        userId,
        summary  -- ADD THIS
    FROM question_sets
    ORDER BY created_at DESC
''')

# In the response JSON:
sets = [{
    'id': row[0],
    'name': row[1],
    'created_at': row[2],
    'userId': row[3],
    'summary': row[4],  # ADD THIS
    # ... other fields ...
} for row in cursor.fetchall()]
```

### 5. Batch Generation Script

**File:** `backend/scripts/generate_all_summaries.py`

```python
#!/usr/bin/env python3
"""
Batch generate summaries for all question sets without summaries.

Usage:
    cd backend
    python3 scripts/generate_all_summaries.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from database import get_db, return_db
from utils.summarize import generate_summary_safe
import time

def main():
    """Generate summaries for all sets missing them."""
    conn = get_db()
    cursor = conn.cursor()

    # Get all sets without summaries
    cursor.execute('''
        SELECT id, name
        FROM question_sets
        WHERE summary IS NULL OR summary = ''
        ORDER BY created_at DESC
    ''')
    sets = cursor.fetchall()

    total = len(sets)
    print(f"\n{'='*60}")
    print(f"Found {total} question sets without summaries")
    print(f"{'='*60}\n")

    if total == 0:
        print("All sets already have summaries! ✓")
        return_db(conn)
        return

    success_count = 0
    fail_count = 0

    for idx, (set_id, set_name) in enumerate(sets, 1):
        try:
            print(f"[{idx}/{total}] Processing: {set_name[:50]}...")

            # Get sample questions
            cursor.execute('''
                SELECT questionText FROM questions
                WHERE setId = ?
                ORDER BY RANDOM()
                LIMIT 8
            ''', (set_id,))

            questions = [{'questionText': row[0]} for row in cursor.fetchall()]

            if not questions:
                print(f"  ⚠ Skipped (no questions)")
                fail_count += 1
                continue

            # Generate summary
            summary = generate_summary_safe(set_name, questions, len(questions))

            if summary:
                # Update database
                cursor.execute(
                    'UPDATE question_sets SET summary = ? WHERE id = ?',
                    (summary, set_id)
                )
                conn.commit()

                print(f"  ✓ Generated: \"{summary}\"")
                success_count += 1
            else:
                print(f"  ✗ Failed to generate")
                fail_count += 1

            # Rate limiting (15 req/min = 4 seconds between requests)
            if idx < total:
                time.sleep(4)

        except KeyboardInterrupt:
            print("\n\n⚠ Interrupted by user")
            break
        except Exception as e:
            print(f"  ✗ Error: {e}")
            fail_count += 1

    return_db(conn)

    print(f"\n{'='*60}")
    print(f"Summary Generation Complete")
    print(f"{'='*60}")
    print(f"Total:   {total}")
    print(f"Success: {success_count} ✓")
    print(f"Failed:  {fail_count} ✗")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()
```

---

## Frontend Implementation

### File Structure
```
frontend/src/
├── views/
│   ├── SetsView.js          # MODIFY: Display summaries + generate button
│   └── HomeView.js          # MODIFY: Display summaries in recent sets
├── lib/
│   └── api.js               # MODIFY: Add generateSummary API call
└── App.css                  # MODIFY: Add summary styles
```

### 1. Add API Function

**File:** `frontend/src/lib/api.js`

```javascript
// Add this new function
export const api = {
  // ... existing methods ...

  async generateSummary(setId) {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/sets/${setId}/generate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate summary');
    }

    return response.json();
  },
};
```

### 2. Update SetsView to Display Summaries

**File:** `frontend/src/views/SetsView.js`

```javascript
import { useState } from 'react';
import { api } from '../lib';

function SetsView({ questionSets, practice, startPracticeWrapper, backendWaking }) {
  const [generatingId, setGeneratingId] = useState(null);

  const handleGenerateSummary = async (setId) => {
    try {
      setGeneratingId(setId);
      const { summary } = await api.generateSummary(setId);

      // Update local state (you'll need to pass loadQuestionSets from parent)
      // Or reload question sets
      window.location.reload(); // Quick solution

    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary: ' + error.message);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="sets-view">
      <h2>Browse Question Sets</h2>

      <div className="sets-grid">
        {questionSets.map(set => (
          <div key={set.id} className="set-card">
            <div className="set-header">
              <h3>{set.name}</h3>

              {/* NEW: Display summary or generate button */}
              {set.summary ? (
                <p className="set-summary">{set.summary}</p>
              ) : (
                <button
                  className="btn-generate-summary"
                  onClick={() => handleGenerateSummary(set.id)}
                  disabled={generatingId === set.id || backendWaking}
                >
                  {generatingId === set.id ? 'Generating...' : '✨ Generate Description'}
                </button>
              )}
            </div>

            <div className="set-stats">
              {/* existing stats */}
            </div>

            {/* existing buttons */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Update HomeView to Show Summaries

**File:** `frontend/src/views/HomeView.js`

Similar changes - display `set.summary` if it exists.

### 4. Add CSS Styles

**File:** `frontend/src/App.css`

```css
/* AI-generated summary styles */
.set-summary {
  color: #666;
  font-size: 14px;
  font-style: italic;
  margin: 8px 0 12px 0;
  line-height: 1.4;
}

.btn-generate-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-generate-summary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-generate-summary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Environment Setup

### 1. Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 2. Add to Environment Variables

**File:** `backend/.env`

```bash
# Add this line
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

**File:** `backend/.env.example` (for documentation)

```bash
# Google Gemini API for AI-generated summaries
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Install Python Package

```bash
cd backend
pip install google-generativeai
```

Update `requirements.txt`:
```
google-generativeai>=0.3.0
```

---

## Testing Plan

### Manual Testing

1. **Test auto-generation during upload:**
   ```
   - Upload a new TSV file
   - Check if summary appears immediately in Browse Sets
   - Verify summary is stored in database
   ```

2. **Test on-demand generation:**
   ```
   - Find a set without summary (or set summary to NULL in DB)
   - Click "Generate Description" button
   - Verify summary generates and displays
   ```

3. **Test error handling:**
   ```
   - Disable API key (set to invalid value)
   - Upload file - should still succeed without summary
   - Click generate button - should show error message
   ```

4. **Test batch script:**
   ```bash
   cd backend
   python3 scripts/generate_all_summaries.py
   ```

### Database Verification

```sql
-- Check summaries
SELECT id, name, summary FROM question_sets LIMIT 10;

-- Count sets with/without summaries
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN summary IS NOT NULL THEN 1 ELSE 0 END) as with_summary,
  SUM(CASE WHEN summary IS NULL THEN 1 ELSE 0 END) as without_summary
FROM question_sets;
```

---

## Deployment Steps

### Step 1: Database Migration
```sql
ALTER TABLE question_sets ADD COLUMN summary TEXT;
```

### Step 2: Backend Deployment
1. Install `google-generativeai` package
2. Add `GOOGLE_AI_API_KEY` to production `.env`
3. Deploy backend code with new routes and utils
4. Test API endpoint: `POST /api/sets/:id/generate-summary`

### Step 3: Frontend Deployment
1. Update frontend code with summary display
2. Build production bundle: `npm run build`
3. Deploy frontend

### Step 4: Batch Generate Existing Sets
```bash
cd backend
python3 scripts/generate_all_summaries.py
```

---

## Cost Estimation

### Gemini 1.5 Flash Pricing
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

### Per Summary
- Input: ~500 tokens (set name + 8 sample questions)
- Output: ~15 tokens (summary text)
- Cost: ~$0.0001 per summary

### For 100 Question Sets
- Total cost: **~$0.01** (one penny)
- Free tier covers: 1M tokens/day = ~2000 summaries/day

**Conclusion:** Effectively free for most use cases.

---

## Rollback Plan

If issues occur:

1. **Frontend only:** Remove summary display, redeploy
2. **Backend only:** Comment out summary generation in upload route
3. **Database:** No rollback needed (nullable column, backward compatible)
4. **API Key issues:** Summaries fail gracefully, uploads still work

---

## Future Enhancements

### Phase 2 Ideas
1. **User editing:** Allow users to edit AI-generated summaries
2. **Regenerate button:** Let users regenerate if they don't like summary
3. **Category detection:** Extract topics/tags from summaries
4. **Search by summary:** Add full-text search on summaries
5. **Quality rating:** Let users rate summary quality
6. **Multi-language:** Generate summaries in user's language

---

## Success Metrics

### What to Monitor
- **Generation success rate:** % of uploads with summaries
- **API latency:** Time added to upload flow
- **User engagement:** Do users interact more with sets that have summaries?
- **Cost:** Monthly Gemini API spending

### Expected Results
- ✅ 95%+ of new uploads get automatic summaries
- ✅ Upload time increases by <2 seconds
- ✅ Monthly cost stays under $1
- ✅ Improved user comprehension of set contents

---

## References

- Gemini API Docs: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing
- Python SDK: https://github.com/google/generative-ai-python
- API Key: https://aistudio.google.com/app/apikey

---

## Quick Start Checklist

- [ ] Get Gemini API key
- [ ] Add `GOOGLE_AI_API_KEY` to `.env`
- [ ] Install `pip install google-generativeai`
- [ ] Run database migration (`ALTER TABLE...`)
- [ ] Create `backend/utils/summarize.py`
- [ ] Modify upload routes to generate summaries
- [ ] Add `/generate-summary` endpoint
- [ ] Update frontend to display summaries
- [ ] Add CSS styles
- [ ] Test with new upload
- [ ] Run batch script for existing sets
- [ ] Deploy to production

---

**Last Updated:** December 21, 2025
**Status:** Ready for Implementation
**Estimated Time:** 2-3 hours
