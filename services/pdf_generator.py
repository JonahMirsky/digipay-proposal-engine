"""Generate branded PDF from document data."""

from datetime import datetime, timezone
from flask import render_template

try:
    from weasyprint import HTML
    _HAS_WEASYPRINT = True
except ImportError:
    _HAS_WEASYPRINT = False


def generate_pdf(doc, brand_name='DigiPay', accent_color='#76D7FA'):
    if not _HAS_WEASYPRINT:
        raise RuntimeError('PDF generation not available in this environment. Use browser print instead.')

    generated_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')

    html = render_template(
        'pdf.html',
        title=doc.get('title', f'{brand_name} Document'),
        sections=doc.get('sections', []),
        meta=doc.get('meta', {}),
        brand_name=brand_name,
        accent_color=accent_color,
        generated_at=generated_at,
    )
    return HTML(string=html).write_pdf()
