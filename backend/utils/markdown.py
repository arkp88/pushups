"""Markdown to HTML conversion utilities"""
import re
import bleach


def convert_markdown_to_html(text):
    """
    Convert simple markdown formatting to HTML and sanitize output.

    Supports:
    - **bold** → <strong>bold</strong>
    - *italic* → <em>italic</em>
    - _italic_ → <em>italic</em>

    Args:
        text (str): Markdown text to convert

    Returns:
        str: Sanitized HTML
    """
    if not text:
        return text

    # Convert **bold** to <strong>bold</strong> (DOTALL flag to match across newlines)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text, flags=re.DOTALL)

    # Convert *italic* to <em>italic</em> (but not if part of **)
    # Use negative lookbehind and lookahead to avoid matching ** markers
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', text, flags=re.DOTALL)

    # Convert _italic_ to <em>italic</em>
    text = re.sub(r'_(.+?)_', r'<em>\1</em>', text, flags=re.DOTALL)

    # Sanitize HTML to prevent XSS attacks - only allow safe formatting tags
    allowed_tags = ['strong', 'em', 'br', 'p']
    text = bleach.clean(text, tags=allowed_tags, strip=True)

    return text
