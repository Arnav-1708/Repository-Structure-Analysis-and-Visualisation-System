# wraps the Gemini API - keeping this in its own file so swapping providers later
# doesn't mean touching the route or cache logic

import google.generativeai as genai

# tried a few prompt formats, this one gave the most consistent 3-sentence output
SUMMARY_PROMPT = """Explain what this code file does in exactly 3 simple sentences.
Avoid jargon where possible, and don't repeat the filename back in the explanation.

Filename: {filename}

Code:
{code}
"""


class AISummaryError(Exception):
    pass


def summarize_file(code_text: str, filename: str, api_key: str, model_name: str, max_chars: int) -> str:
    if not api_key:
        raise AISummaryError("Gemini API key not set")

    truncated = code_text[:max_chars]

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(SUMMARY_PROMPT.format(filename=filename, code=truncated))
    except Exception as e:
        raise AISummaryError(f"Gemini request failed: {e}") from e

    if not resp.text:
        raise AISummaryError("empty response from Gemini")

    return resp.text.strip()
