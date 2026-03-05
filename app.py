"""Multi-Brand Proposal Engine."""

import io, os, secrets, time, threading
from datetime import datetime, timezone
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET', secrets.token_hex(32))

pdf_store = {}
pdf_lock = threading.Lock()

html_store = {}
html_lock = threading.Lock()
HTML_EXPIRY = 7 * 24 * 3600  # 7 days


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/health')
def health():
    return jsonify(status='ok')


@app.route('/api/upload', methods=['POST'])
def upload():
    from services.file_parser import parse_file
    if 'file' not in request.files or not request.files['file'].filename:
        return jsonify(error='No file'), 400
    try:
        return jsonify(parse_file(request.files['file']))
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/fetch-url', methods=['POST'])
def fetch_url():
    from services.url_fetcher import fetch_url as do_fetch
    data = request.get_json()
    if not data or not data.get('url'):
        return jsonify(error='No URL provided'), 400
    try:
        return jsonify(do_fetch(data['url']))
    except ValueError as e:
        return jsonify(error=str(e)), 400
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/brandify', methods=['POST'])
def brandify():
    from services.claude_engine import brandify as do_brandify
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify(error='No content'), 400
    try:
        return jsonify(do_brandify(
            data['text'],
            data.get('api_key', ''),
            data.get('brand_name', 'DigiPay'),
        ))
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/template', methods=['POST'])
def template():
    from services.claude_engine import generate_template
    data = request.get_json()
    if not data or not data.get('template_id') or not data.get('fields'):
        return jsonify(error='Missing template data'), 400
    try:
        return jsonify(generate_template(
            data['template_id'],
            data.get('template_name', data['template_id']),
            data['fields'],
            data.get('api_key', ''),
            data.get('brand_name', 'DigiPay'),
        ))
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/pdf', methods=['POST'])
def pdf():
    from services.pdf_generator import generate_pdf
    data = request.get_json()
    if not data:
        return jsonify(error='No data'), 400

    brand_name = data.get('brand_name', 'DigiPay')
    accent_color = data.get('accent_color', '#76D7FA')

    if data.get('_token'):
        token = secrets.token_urlsafe(20)
        pdf_bytes = generate_pdf(data, brand_name, accent_color)
        with pdf_lock:
            pdf_store[token] = {'bytes': pdf_bytes, 'ts': time.time(), 'brand': brand_name}
        return jsonify(token=token)

    try:
        pdf_bytes = generate_pdf(data, brand_name, accent_color)
        dl_name = f'{brand_name}-Document.pdf'
        return send_file(io.BytesIO(pdf_bytes), mimetype='application/pdf',
                         as_attachment=True, download_name=dl_name)
    except Exception as e:
        return jsonify(error=str(e)), 500


@app.route('/api/pdf/<token>')
def serve_pdf(token):
    with pdf_lock:
        entry = pdf_store.pop(token, None)
    if not entry:
        return jsonify(error='Expired'), 404
    brand = entry.get('brand', 'DigiPay')
    return send_file(io.BytesIO(entry['bytes']), mimetype='application/pdf',
                     as_attachment=True, download_name=f'{brand}-Document.pdf')


@app.route('/api/share', methods=['POST'])
def share_doc():
    data = request.get_json()
    if not data:
        return jsonify(error='No data'), 400

    # Prune expired entries
    now = time.time()
    with html_lock:
        expired = [k for k, v in html_store.items() if now - v['ts'] > HTML_EXPIRY]
        for k in expired:
            del html_store[k]

    token = secrets.token_urlsafe(20)
    with html_lock:
        html_store[token] = {
            'doc': data.get('doc', {}),
            'brand_name': data.get('brand_name', 'DigiPay'),
            'accent_color': data.get('accent_color', '#76D7FA'),
            'logo': data.get('logo', ''),
            'ts': now,
        }

    url = f'{request.host_url}view/{token}'
    return jsonify(token=token, url=url)


@app.route('/view/<token>')
def view_doc(token):
    with html_lock:
        entry = html_store.get(token)
    if not entry or time.time() - entry['ts'] > HTML_EXPIRY:
        return 'This link has expired.', 404

    doc = entry['doc']
    return render_template('view.html',
                           title=doc.get('title', 'Document'),
                           sections=doc.get('sections', []),
                           meta=doc.get('meta', {}),
                           brand_name=entry['brand_name'],
                           accent_color=entry['accent_color'],
                           logo=entry['logo'])


BUG_REPORT_REPO = os.environ.get('BUG_REPORT_REPO', 'JonahMirsky/digipay-proposal-engine')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')


@app.route('/api/report-bug', methods=['POST'])
def report_bug():
    import requests as http
    data = request.get_json()
    if not data or not data.get('error'):
        return jsonify(error='No error provided'), 400

    token = GITHUB_TOKEN
    if not token:
        return jsonify(error='GITHUB_TOKEN not configured'), 500

    error_msg = data['error']
    source_text = (data.get('source_text') or '')[:2000]
    brand_name = data.get('brand_name', 'Unknown')
    context = data.get('context', '')
    ts = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

    title = f"[Bug Report] {error_msg[:80]}"
    body = (
        f"## Bug Report\n\n"
        f"**Error:** {error_msg}\n"
        f"**Brand:** {brand_name}\n"
        f"**Timestamp:** {ts}\n"
        f"**Context:** {context}\n\n"
        f"### Source Text (truncated)\n```\n{source_text or 'N/A'}\n```"
    )

    try:
        r = http.post(
            f'https://api.github.com/repos/{BUG_REPORT_REPO}/issues',
            headers={
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json',
            },
            json={'title': title, 'body': body, 'labels': ['bug']},
            timeout=15,
        )
        if r.status_code not in (200, 201):
            msg = r.json().get('message', 'GitHub API error')
            return jsonify(error=msg), 500
        return jsonify(url=r.json()['html_url'])
    except Exception as e:
        return jsonify(error=str(e)), 500


if __name__ == '__main__':
    app.run(debug=True, port=5050)
