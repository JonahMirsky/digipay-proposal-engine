"""Claude API — convert any document into branded output."""

import json
import os
import anthropic


def _build_system(brand_name):
    return f"""You re-brand documents for {brand_name}. You receive raw content (spreadsheets, invoices, proposals, notes, summaries) and output a {brand_name}-branded version that is as faithful to the original format as possible.

## Core Principle
You are ONLY rebranding the design. The content structure, layout, and copy must stay as close to the source as possible. Do NOT restructure, reorganize, or reformat the data.

## Rules
1. PRESERVE every number, name, date, rate, and data point exactly. Never invent, summarize, or drop data.
2. PRESERVE the original document structure. If the source has a table with columns, output an HTML table with the SAME columns. If it has bullet lists, keep bullet lists. If it has paragraphs, keep paragraphs. Do NOT convert tables to lists or lists to tables.
3. For spreadsheets and tabular data: maintain the EXACT column structure from the source. If the source has columns like "Name | Role | Company | Title", output an HTML table with those exact columns. Never flatten a multi-column table into a single-column list.
4. Keep the same document type — invoice stays invoice, spreadsheet stays table, report stays report.
5. Only change brand references: replace any competitor brand names with {brand_name}, add "Prepared by {brand_name}" if not present.
6. Keep it concise. No filler copy. No marketing fluff. Just the data, branded.
7. For large datasets, include ALL rows. Never truncate or summarize with "and X more...".

## Output Format
Return ONLY valid JSON:
{{
  "title": "Document title",
  "sections": [
    {{
      "heading": "Section Name",
      "content": "HTML using <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>"
    }}
  ],
  "meta": {{
    "prepared_for": "name or company if found, else empty",
    "date": "date if found, else empty",
    "doc_type": "invoice|proposal|spreadsheet|summary|report|other"
  }}
}}"""


def _build_template_system(brand_name):
    return f"""You generate professional {brand_name}-branded business documents from structured form data.

## Rules
1. Use ONLY the data provided. Never invent names, numbers, dates, or details.
2. Structure the output as a professional document with clear sections.
3. Use HTML for formatting: <table>, <p>, <ul>, <li>, <strong>, <em>.
4. For line items provided as "description, qty, price" or "description, amount", build proper HTML tables with columns, subtotals, and totals.
5. Keep it clean and professional. No filler. No placeholder text.
6. All monetary values should be formatted properly ($X,XXX.XX).
7. Include "Prepared by {brand_name}" in the meta.

## Output Format
Return ONLY valid JSON:
{{
  "title": "Document title (e.g. 'Invoice INV-001' or 'Pricing Proposal for Acme Corp')",
  "sections": [
    {{
      "heading": "Section Name",
      "content": "HTML content"
    }}
  ],
  "meta": {{
    "prepared_for": "client/company name",
    "date": "document date",
    "doc_type": "invoice|proposal|receipt|agreement|sow|summary"
  }}
}}"""


def _call_claude(system_prompt, user_prompt, api_key=''):
    key = api_key or os.environ.get('ANTHROPIC_API_KEY', '')
    if not key:
        raise ValueError('ANTHROPIC_API_KEY not configured. Set it in .env or environment variables.')

    client = anthropic.Anthropic(api_key=key)
    msg = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=16000,
        system=system_prompt,
        messages=[{'role': 'user', 'content': user_prompt}],
    )

    text = msg.content[0].text.strip()
    if text.startswith('```'):
        lines = text.split('\n')
        lines = lines[1:] if lines[0].startswith('```') else lines
        lines = lines[:-1] if lines and lines[-1].strip() == '```' else lines
        text = '\n'.join(lines)
    return json.loads(text)


def brandify(source_text, api_key='', brand_name='DigiPay'):
    return _call_claude(
        _build_system(brand_name),
        f'Re-brand this document as {brand_name}. PRESERVE the exact structure and formatting of the source — tables must remain tables with the same columns, lists must remain lists. Only change branding, not layout. Include ALL rows and data points:\n\n{source_text[:30000]}',
        api_key,
    )


def generate_template(template_id, template_name, fields, api_key='', brand_name='DigiPay'):
    field_text = '\n'.join(f'{k}: {v}' for k, v in fields.items() if v)
    prompt = f'Generate a professional {brand_name}-branded {template_name} with these details:\n\n{field_text}'
    return _call_claude(_build_template_system(brand_name), prompt, api_key)
