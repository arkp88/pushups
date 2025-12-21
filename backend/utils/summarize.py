"""
AI-powered summary generation for question sets using Google Gemini API.
"""
from google import genai
from google.genai import types
import os
from typing import List, Dict

# Configure Gemini API
client = genai.Client(api_key=os.getenv('GOOGLE_AI_API_KEY'))

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

        # Construct prompt focused on content analysis
        prompt = f"""Read these quiz questions carefully and write a summary describing what topics they cover.

Sample questions from this quiz set:
{samples}

Based on these questions, what is this quiz about? Look for patterns:
- Are they about movies/films? Sports? Geography? History? Science?
- Is there a specific theme or constraint (e.g., all answers start with same letter)?
- What specific topics appear (actors, countries, dates, concepts)?

Write a clear summary using 7-9 words that describes the quiz content.

Good examples:
- "Identifying Bollywood films from actor photos and movie stills"
- "Indian geography covering states, capitals, rivers and landmarks"
- "Cricket history including players, matches, records and tournaments"
- "Film titles and trivia all starting with letter C"
- "Mixed general knowledge covering various topics and themes"

Your summary (7-9 words):"""

        # Try up to 2 times to get a valid summary
        for attempt in range(2):
            # Call Gemini API with higher temperature for more descriptive responses
            # Using flash-lite for more generous free tier (1000 requests/day vs 20)
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=100,
                    temperature=0.7,  # Higher temperature for more creative/descriptive responses
                )
            )

            # Extract and clean summary
            summary = response.text.strip()
            summary = summary.strip('"\'')

            # Validate word count
            word_count = len(summary.split())

            if word_count >= 6:
                # Valid summary - truncate if too long
                if len(summary) > 100:
                    summary = summary[:97] + "..."
                return summary

            # Too short - modify prompt for retry with more specific instructions
            if attempt == 0:
                prompt = f"""Your previous response "{summary}" was too short ({word_count} words).

Analyze these questions more carefully:
{samples}

What specific topic or theme do they share? Write a descriptive summary using 7-9 words.
Examples:
- "Film identification from actor stills and movie scenes"
- "Geography trivia about world capitals and countries"
- "Movies and actors starting with the letter C"

Your detailed summary (7-9 words):"""

        # If still too short after retries, try to infer from questions
        if word_count < 6:
            # Analyze sample questions to infer topic
            samples_text = " ".join([q.get('questionText', '') for q in sample_questions[:5]]).lower()

            if 'film' in samples_text or 'movie' in samples_text or 'actor' in samples_text or 'cinema' in samples_text:
                summary = "Film and cinema trivia questions covering movies and actors"
            elif 'sport' in samples_text or 'cricket' in samples_text or 'football' in samples_text:
                summary = "Sports trivia covering players, matches, records and history"
            elif 'geography' in samples_text or 'country' in samples_text or 'capital' in samples_text:
                summary = "Geography questions about countries, capitals and world locations"
            else:
                summary = "General knowledge trivia covering various topics and themes"

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
