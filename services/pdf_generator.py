"""Generate branded PDF from document data."""

from flask import render_template
from weasyprint import HTML


def generate_pdf(doc, brand_name='DigiPay', accent_color='#76D7FA'):
    html = render_template(
        'pdf.html',
        title=doc.get('title', f'{brand_name} Document'),
        sections=doc.get('sections', []),
        meta=doc.get('meta', {}),
        brand_name=brand_name,
        accent_color=accent_color,
    )
    return HTML(string=html).write_pdf()
