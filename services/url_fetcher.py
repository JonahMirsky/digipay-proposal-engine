"""Fetch and extract text content from URLs."""

import csv
import io
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

import requests

_TIMEOUT = 10
_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


class _HTMLTextExtractor(HTMLParser):
    """Strip HTML tags, keep text."""

    _SKIP = {'script', 'style', 'head', 'meta', 'link', 'noscript'}

    def __init__(self):
        super().__init__()
        self._parts = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self._SKIP and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self._parts.append(text)

    def get_text(self):
        return '\n'.join(self._parts)


def _html_to_text(html):
    parser = _HTMLTextExtractor()
    parser.feed(html)
    return parser.get_text()


def _google_sheet_id(url):
    m = re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', url)
    return m.group(1) if m else None


def _google_doc_id(url):
    m = re.search(r'/document/d/([a-zA-Z0-9_-]+)', url)
    return m.group(1) if m else None


def fetch_url(url_string):
    """Fetch a URL and return extracted text.

    Returns dict: {"text": "...", "source": url}
    Raises ValueError on bad input, RuntimeError on fetch failure.
    """
    url_string = (url_string or '').strip()
    if not url_string:
        raise ValueError('No URL provided')

    parsed = urlparse(url_string)
    if parsed.scheme not in ('http', 'https'):
        raise ValueError('Only http/https URLs are supported')

    # Google Sheets → CSV export
    sheet_id = _google_sheet_id(url_string)
    if sheet_id:
        export_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
        r = requests.get(export_url, timeout=_TIMEOUT)
        r.raise_for_status()
        if len(r.content) > _MAX_BYTES:
            raise RuntimeError('Response too large (>5 MB)')
        reader = csv.reader(io.StringIO(r.text))
        lines = [' | '.join(row) for row in reader if any(c.strip() for c in row)]
        text = '\n'.join(lines)
        return {'text': text, 'source': url_string}

    # Google Docs → plain text export
    doc_id = _google_doc_id(url_string)
    if doc_id:
        export_url = f'https://docs.google.com/document/d/{doc_id}/export?format=txt'
        r = requests.get(export_url, timeout=_TIMEOUT)
        r.raise_for_status()
        if len(r.content) > _MAX_BYTES:
            raise RuntimeError('Response too large (>5 MB)')
        return {'text': r.text.strip(), 'source': url_string}

    # Generic URL → fetch HTML, strip to text
    r = requests.get(url_string, timeout=_TIMEOUT, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ProposalEngine/1.0)',
    })
    r.raise_for_status()
    if len(r.content) > _MAX_BYTES:
        raise RuntimeError('Response too large (>5 MB)')

    content_type = r.headers.get('Content-Type', '')
    if 'text/html' in content_type or '<html' in r.text[:500].lower():
        text = _html_to_text(r.text)
    else:
        text = r.text

    if not text.strip():
        raise RuntimeError('No text content could be extracted from this URL')

    return {'text': text.strip(), 'source': url_string}
