/* Multi-Brand Proposal Engine */

let extracted = '';
let result = null;
let currentTab = 'convert';
let currentTemplate = null;
let currentBrand = null;

const $ = id => document.getElementById(id);

/* ── Brand Configuration ── */

const BRANDS = {
  digipay: {
    name: 'DigiPay',
    tagline: 'Digital payment solutions',
    accent: '#76D7FA',
    bg: '#04192a',
    surface: '#0d2d4a',
    gradientEnd: '#4facfe',
    logo: '/static/img/logo.svg',
    logoWhite: '/static/img/logo-white.svg',
  },
  allpay: {
    name: 'AllPay',
    tagline: 'Unified payment processing',
    accent: '#1570EF',
    bg: '#04041a',
    surface: '#0d0d30',
    gradientEnd: '#728CF6',
    logo: '/static/img/logo-allpay.svg',
    logoWhite: '/static/img/logo-allpay-white.svg',
  },
  sdp: {
    name: 'SDP',
    tagline: 'Secure Digital Payments',
    accent: '#3b9eff',
    bg: '#041528',
    surface: '#0c2a48',
    gradientEnd: '#6dc0ff',
    logo: '/static/img/logo-sdp.svg',
    logoWhite: '/static/img/logo-sdp-white.svg',
  },
  finvaro: {
    name: 'Finvaro',
    tagline: 'Next-gen financial infrastructure',
    accent: '#EAD9FD',
    bg: '#0e0620',
    surface: '#1c1038',
    gradientEnd: '#b08cff',
    logo: '/static/img/logo-finvaro-black.png',
    logoWhite: '/static/img/logo-finvaro-white.png',
  },
  owlpay: {
    name: 'OwlPay',
    tagline: 'Crypto payment processing',
    accent: '#1a7d72',
    bg: '#021a16',
    surface: '#0a302a',
    gradientEnd: '#2ab5a0',
    logo: '/static/img/logo-owlpay.svg',
    logoWhite: '/static/img/logo-owlpay-white.svg',
  },
};

/* ── Hex to RGBA helper ── */

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ── Brand Selection ── */

/* ── Brand Cycle Animation ── */

let cycleInterval = null;

function startBrandCycle() {
  const img = $('home-cycle-img');
  if (!img) return;
  const brandList = Object.values(BRANDS);
  let idx = 0;

  function tick() {
    const brand = brandList[idx % brandList.length];
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = brand.logoWhite;
      img.alt = brand.name;
      img.style.opacity = '1';
    }, 200);
    idx++;
  }

  tick();
  cycleInterval = setInterval(tick, 1400);
}

function stopBrandCycle() {
  if (cycleInterval) { clearInterval(cycleInterval); cycleInterval = null; }
}

/* ── Hash-based Routing ── */

let _skipHash = false;

function pushHash(hash) {
  if (_skipHash) return;
  const target = '#' + hash;
  if (location.hash !== target) {
    history.pushState(null, '', target);
  }
}

function getHash() {
  return location.hash.slice(1) || 'home';
}

function navigateToHash() {
  const hash = getHash();
  if (hash === 'home' || !hash) {
    if (currentBrand) {
      _skipHash = true;
      goHome();
      _skipHash = false;
    }
    return;
  }

  const parts = hash.split('/');
  const brandId = parts[0];
  const tab = parts[1] || 'convert';

  if (!BRANDS[brandId]) {
    _skipHash = true;
    goHome();
    _skipHash = false;
    return;
  }

  _skipHash = true;
  if (!currentBrand || currentBrand.id !== brandId) {
    selectBrand(brandId);
  }
  if (tab !== currentTab) {
    switchTab(tab);
  }
  _skipHash = false;
}

window.addEventListener('hashchange', navigateToHash);

/* ── Brand Selection ── */

function selectBrand(id) {
  const brand = BRANDS[id];
  if (!brand) return;
  currentBrand = brand;
  currentBrand.id = id;
  localStorage.setItem('dp_brand', id);
  stopBrandCycle();

  const s = document.documentElement.style;
  s.setProperty('--accent', brand.accent);
  s.setProperty('--accent-bright', brand.accent);
  s.setProperty('--accent-dim', hexToRgba(brand.accent, 0.08));
  s.setProperty('--accent-mid', hexToRgba(brand.accent, 0.15));
  s.setProperty('--accent-border', hexToRgba(brand.accent, 0.2));
  s.setProperty('--accent-glow', hexToRgba(brand.accent, 0.06));
  s.setProperty('--bg', brand.bg);
  s.setProperty('--surface', brand.surface);
  s.setProperty('--gradient', `linear-gradient(135deg, ${brand.accent} 0%, ${brand.gradientEnd} 50%, ${brand.gradientEnd} 100%)`);
  s.setProperty('--gradient-subtle', `linear-gradient(135deg, ${hexToRgba(brand.accent, 0.12)} 0%, ${hexToRgba(brand.gradientEnd, 0.08)} 100%)`);
  s.setProperty('--shadow-glow', `0 0 40px ${hexToRgba(brand.accent, 0.08)}`);

  // Update nav — show brand logo + home btn, hide home mark
  $('nav-brand-logo').src = brand.logoWhite;
  $('nav-brand-logo').alt = brand.name;
  $('nav-brand-logo').classList.remove('hide');
  $('nav-brand-text').classList.add('hide');
  $('nav-brand-switch').classList.remove('hide');
  $('nav-home-btn').classList.remove('hide');
  $('nav-home-mark').classList.add('hide');
  $('nav-tabs-wrap').classList.remove('hide');
  populateBrandDropdown();

  // Update hero brand logo
  const heroLogo = $('hero-brand-logo');
  heroLogo.src = brand.logoWhite;
  heroLogo.alt = brand.name;
  heroLogo.classList.remove('hide');

  // Update loading text
  const loadTexts = document.querySelectorAll('.brand-loading-text');
  loadTexts.forEach(el => { el.textContent = brand.name; });

  // Show engine, hide home
  $('home').classList.remove('active');
  $('home').style.display = 'none';
  $('engine').style.display = 'block';
  switchTab('convert');
}

function goHome() {
  localStorage.removeItem('dp_brand');
  currentBrand = null;

  // Reset theme to default black
  const s = document.documentElement.style;
  s.setProperty('--bg', '#060609');
  s.setProperty('--surface', '#12121a');
  s.setProperty('--accent', '#76D7FA');
  s.setProperty('--accent-bright', '#a0e8ff');
  s.setProperty('--accent-dim', 'rgba(118, 215, 250, 0.08)');
  s.setProperty('--accent-mid', 'rgba(118, 215, 250, 0.15)');
  s.setProperty('--accent-border', 'rgba(118, 215, 250, 0.2)');
  s.setProperty('--accent-glow', 'rgba(118, 215, 250, 0.06)');
  s.setProperty('--gradient', 'linear-gradient(135deg, #76D7FA 0%, #4facfe 50%, #7c6df0 100%)');
  s.setProperty('--gradient-subtle', 'linear-gradient(135deg, rgba(118,215,250,0.12) 0%, rgba(124,109,240,0.08) 100%)');
  s.setProperty('--shadow-glow', '0 0 40px rgba(118, 215, 250, 0.08)');

  $('home').style.display = '';
  $('home').classList.add('active');
  $('engine').style.display = 'none';
  $('nav-tabs-wrap').classList.add('hide');
  $('nav-home-btn').classList.add('hide');

  // Keep brand dropdown visible with "Brands" text
  $('nav-brand-switch').classList.remove('hide');
  $('nav-brand-text').classList.remove('hide');
  $('nav-brand-logo').classList.add('hide');

  // Show home mark
  $('nav-home-mark').classList.remove('hide');

  // Populate dropdown with all brands
  populateBrandDropdown();

  // Restart brand cycle
  startBrandCycle();

  // Reset state
  reset();

  pushHash('home');
}

/* ── Brand Dropdown ── */

function populateBrandDropdown() {
  const dd = $('nav-brand-dropdown');
  dd.innerHTML = '';
  for (const [id, brand] of Object.entries(BRANDS)) {
    if (currentBrand && currentBrand.id === id) continue;
    const item = document.createElement('button');
    item.className = 'brand-dd-item';
    item.innerHTML = `<img src="${brand.logoWhite}" alt="${brand.name}">`;
    item.onclick = () => {
      closeBrandDropdown();
      selectBrand(id);
    };
    dd.appendChild(item);
  }
}

function toggleBrandDropdown(e) {
  e.stopPropagation();
  $('nav-brand-dropdown').classList.toggle('open');
}

function closeBrandDropdown() {
  $('nav-brand-dropdown').classList.remove('open');
}

document.addEventListener('click', closeBrandDropdown);

/* ── Tab Switching ── */

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  $(`tab-${tab}`).classList.add('active');

  // Update mode toggle buttons
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  if (tab === 'convert') {
    $('mode-convert') && $('mode-convert').classList.add('active');
    $('mode-convert-2') && $('mode-convert-2').classList.add('active');
  } else {
    $('mode-templates') && $('mode-templates').classList.add('active');
    $('mode-templates-2') && $('mode-templates-2').classList.add('active');
  }

  if (currentBrand) {
    pushHash(tab === 'convert' ? currentBrand.id : `${currentBrand.id}/${tab}`);
  }
}

/* ── View Management ── */

function show(id) {
  const tab = $(id).closest('.tab') || $(id).parentElement;
  tab.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(id).classList.add('active');
}

/* ── Source Toggle ── */

function setSource(mode) {
  $('tab-file').classList.toggle('active', mode === 'file');
  $('tab-url').classList.toggle('active', mode === 'url');
  $('source-file').classList.toggle('active', mode === 'file');
  $('source-url').classList.toggle('active', mode === 'url');
}

/* ── Upload ── */

function initUploadListeners() {
  $('drop').addEventListener('click', () => $('file').click());
  $('drop').addEventListener('dragover', e => { e.preventDefault(); $('drop').classList.add('over'); });
  $('drop').addEventListener('dragleave', () => $('drop').classList.remove('over'));
  $('drop').addEventListener('drop', e => {
    e.preventDefault(); $('drop').classList.remove('over');
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files[0]);
  });
  $('file').addEventListener('change', () => { if ($('file').files.length) upload($('file').files[0]); });
  $('paste').addEventListener('input', updateBtn);
}

async function upload(file) {
  $('badge').classList.remove('hide');
  $('badge-name').textContent = file.name;
  $('err').textContent = '';

  const fd = new FormData();
  fd.append('file', file);
  try {
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    extracted = d.text;
  } catch (e) {
    extracted = '';
    $('badge').classList.add('hide');
    $('err').textContent = e.message;
  }
  updateBtn();
}

function clearFile() {
  $('badge').classList.add('hide');
  $('file').value = '';
  extracted = '';
  updateBtn();
}

/* ── URL Fetch ── */

async function fetchUrl() {
  const url = $('url-input').value.trim();
  if (!url) return;

  const btn = $('url-fetch-btn');
  btn.disabled = true;
  btn.textContent = 'Fetching...';
  $('err').textContent = '';

  try {
    const r = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    extracted = d.text;

    // Show URL badge
    let display = url;
    try { display = new URL(url).hostname + new URL(url).pathname.slice(0, 30); } catch (_) {}
    $('url-badge-name').textContent = display;
    $('url-badge').classList.remove('hide');
  } catch (e) {
    extracted = '';
    $('url-badge').classList.add('hide');
    $('err').textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Fetch';
    updateBtn();
  }
}

function clearUrl() {
  $('url-badge').classList.add('hide');
  $('url-input').value = '';
  extracted = '';
  updateBtn();
}

function updateBtn() {
  $('go').disabled = !(extracted || $('paste').value.trim());
}

/* ── Brandify ── */

async function run() {
  const text = extracted || $('paste').value.trim();
  if (!text) return;

  show('v-loading');
  $('err').textContent = '';

  const brandName = currentBrand ? currentBrand.name : 'DigiPay';

  try {
    const r = await fetch('/api/brandify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, brand_name: brandName }),
    });
    let d;
    try { d = await r.json(); } catch (_) {
      throw new Error('Server returned an invalid response. Please try again.');
    }
    if (!r.ok) throw new Error(d.error || 'Generation failed');
    result = d;
    renderPreview($('preview'), result);
    show('v-result');
  } catch (e) {
    show('v-upload');
    $('err').textContent = e.message;
    const btn = $('report-btn');
    if (btn) {
      btn.classList.remove('hide');
      btn.textContent = 'Report Bug';
      btn.disabled = false;
      _bugCtx['report-btn'] = { error: e.message, source_text: text, context: 'convert' };
    }
  }
}

/* ── Render Preview ── */

function renderPreview(el, data) {
  const brandName = currentBrand ? currentBrand.name : 'DigiPay';
  const logoWhite = currentBrand ? currentBrand.logoWhite : '/static/img/logo-white.svg';

  const meta = data.meta || {};
  let metaLine = [meta.prepared_for, meta.date].filter(Boolean).join(' · ');
  if (!metaLine) metaLine = `${brandName} Branded Document`;

  const footerHtml = `<div class="doc-footer"><span>Confidential</span><span>Prepared by ${brandName}</span></div>`;

  // Build cover page
  const coverPage = `<div class="doc-page">
    <div class="doc-header">
      <img src="${logoWhite}" alt="${brandName}">
      <h1>${data.title || 'Document'}</h1>
      <div class="doc-meta">${metaLine}</div>
    </div>
    <div class="doc-body">${(data.sections && data.sections.length) ? `<h2>${data.sections[0].heading}</h2>${data.sections[0].content}` : ''}</div>
    ${footerHtml}
  </div>`;

  // Remaining sections — group into pages
  const sections = (data.sections || []).slice(1);
  let pages = '';
  const PAGE_CHAR_LIMIT = 3000;
  let pageBuf = '';
  let pageBufLen = 0;

  function flushPage() {
    if (!pageBuf) return '';
    const html = `<div class="doc-page"><div class="doc-body">${pageBuf}</div>${footerHtml}</div>`;
    pageBuf = '';
    pageBufLen = 0;
    return html;
  }

  for (const s of sections) {
    const secHtml = `<h2>${s.heading}</h2>${s.content}`;
    const secLen = s.heading.length + (s.content || '').length;

    // If adding this section would overflow, flush current page first
    if (pageBufLen > 0 && pageBufLen + secLen > PAGE_CHAR_LIMIT) {
      pages += flushPage();
    }

    pageBuf += secHtml;
    pageBufLen += secLen;

    // If this single section is already big enough, flush it as its own page
    if (pageBufLen >= PAGE_CHAR_LIMIT) {
      pages += flushPage();
    }
  }

  // Flush any remaining content
  pages += flushPage();

  el.innerHTML = coverPage + pages;

  // Wrap tables in scrollable containers for mobile
  el.querySelectorAll('.doc-body table').forEach(table => {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

/* ── PDF ── */

async function downloadPdf() {
  const data = result;
  if (!data) return;

  const brandName = currentBrand ? currentBrand.name : 'DigiPay';
  const accent = currentBrand ? currentBrand.accent : '#76D7FA';

  try {
    const r = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, brand_name: brandName, accent_color: accent }),
    });
    if (!r.ok) throw new Error('PDF generation failed');
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(data.title || `${brandName}-Document`).replace(/\s+/g, '-')}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) { alert(e.message); }
}

/* ── Copy Share Link ── */

async function copyShareLink() {
  const data = result;
  if (!data) return;

  const brandName = currentBrand ? currentBrand.name : 'DigiPay';
  const accent = currentBrand ? currentBrand.accent : '#76D7FA';
  const logo = currentBrand ? currentBrand.logoWhite : '/static/img/logo-white.svg';

  // Find all copy-link buttons and update state
  const btns = document.querySelectorAll('.btn-copy-link');
  btns.forEach(b => { b.disabled = true; b.querySelector('span').textContent = 'Generating...'; });

  try {
    const r = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doc: data,
        brand_name: brandName,
        accent_color: accent,
        logo: logo,
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Failed to generate link');

    await navigator.clipboard.writeText(d.url);
    btns.forEach(b => { b.querySelector('span').textContent = 'Link Copied'; });
    setTimeout(() => {
      btns.forEach(b => { b.disabled = false; b.querySelector('span').textContent = 'Copy Link'; });
    }, 2500);
  } catch (e) {
    // Fallback: prompt user
    try {
      const r2 = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc: data, brand_name: brandName, accent_color: accent, logo: logo }),
      });
      const d2 = await r2.json();
      if (d2.url) prompt('Copy this link:', d2.url);
      else alert('Failed to generate link');
    } catch (_) {
      alert('Failed to generate link');
    }
    btns.forEach(b => { b.disabled = false; b.querySelector('span').textContent = 'Copy Link'; });
  }
}

/* ── Share ── */

async function share(platform) {
  const data = result;
  if (!data) return;

  const brandName = currentBrand ? currentBrand.name : 'DigiPay';
  const accent = currentBrand ? currentBrand.accent : '#76D7FA';

  // Get a temp PDF link
  let pdfUrl = '';
  try {
    const r = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, _token: true, brand_name: brandName, accent_color: accent }),
    });
    const d = await r.json();
    if (d.token) {
      pdfUrl = `${location.origin}/api/pdf/${d.token}`;
    }
  } catch (_) {}

  const title = data.title || `${brandName} Document`;
  const msg = `${title} — Prepared by ${brandName}`;
  const fullMsg = pdfUrl ? `${msg}\n${pdfUrl}` : msg;

  switch (platform) {
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(fullMsg)}`);
      break;
    case 'telegram':
      if (pdfUrl) {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(pdfUrl)}&text=${encodeURIComponent(msg)}`);
      } else {
        window.open(`https://t.me/share/url?text=${encodeURIComponent(msg)}`);
      }
      break;
    case 'email':
      window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullMsg)}`);
      break;
    case 'signal':
      try {
        await navigator.clipboard.writeText(fullMsg);
        alert('Link copied to clipboard — paste it in Signal');
      } catch (_) {
        prompt('Copy this link to share via Signal:', fullMsg);
      }
      break;
  }
}

/* ── Report Bug ── */

let _bugCtx = {};

function showReportBtn(btnId, errorMsg, sourceText, context) {
  const btn = $(btnId);
  _bugCtx[btnId] = { error: errorMsg, source_text: sourceText, context: context };
  btn.textContent = 'Report Bug';
  btn.disabled = false;
  btn.classList.remove('hide', 'reported');
}

async function _submitBug(btnId) {
  const btn = $(btnId);
  const ctx = _bugCtx[btnId];
  if (!ctx) return;

  btn.disabled = true;
  btn.textContent = 'Reporting...';

  try {
    const r = await fetch('/api/report-bug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: ctx.error,
        source_text: ctx.source_text,
        brand_name: currentBrand ? currentBrand.name : 'Unknown',
        context: ctx.context,
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    btn.textContent = 'Reported';
    btn.classList.add('reported');
  } catch (e) {
    btn.textContent = 'Report Failed';
    btn.disabled = false;
  }
}

function reportBug() { _submitBug('report-btn'); }
function reportTplBug() { _submitBug('tpl-report-btn'); }

/* ── Reset ── */

function reset() {
  extracted = '';
  result = null;
  $('badge').classList.add('hide');
  $('file').value = '';
  $('url-badge').classList.add('hide');
  $('url-input').value = '';
  $('paste').value = '';
  $('err').textContent = '';
  $('report-btn').classList.add('hide');
  updateBtn();
  show('v-upload');
}

/* ═══ TEMPLATES ═══ */

/*
  Field types:
    text, date          — simple input
    textarea            — multi-line text
    row                 — repeatable table rows with named columns
    list                — repeatable single-line items
    section             — visual group header (maps to a doc section)
*/

const ICONS = {
  invoice: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  pricing_proposal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  receipt: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>',
  sow: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
};

const TEMPLATES = [
  {
    id: 'invoice',
    name: 'Invoice',
    desc: 'Bill a client for products or services',
    sections: [
      {
        heading: 'Invoice Details',
        hint: 'Appears as a details table at the top of the document',
        fields: [
          { key: 'client_name', label: 'Client', type: 'text', placeholder: 'Acme Corp' },
          { key: 'client_email', label: 'Email', type: 'text', placeholder: 'billing@acme.com' },
          { key: 'invoice_number', label: 'Invoice #', type: 'text', placeholder: 'INV-001' },
          { key: 'date', label: 'Invoice Date', type: 'date' },
          { key: 'due_date', label: 'Due Date', type: 'date' },
        ],
      },
      {
        heading: 'Line Items',
        hint: 'Each row becomes a line in the invoice table',
        fields: [
          { key: 'items', type: 'row', columns: ['Description', 'Qty', 'Unit Price'],
            defaults: [
              ['EMT Processing Setup', '1', '$2,500'],
            ]},
        ],
      },
      {
        heading: 'Payment Information',
        hint: 'Select which payment methods to include on the invoice',
        fields: [
          { key: 'payment', type: 'payment' },
        ],
      },
    ],
  },
  {
    id: 'pricing_proposal',
    name: 'Pricing Proposal',
    desc: 'Present pricing options to a prospect',
    sections: [
      {
        heading: 'Proposal Details',
        hint: 'Appears as a summary table at the top',
        fields: [
          { key: 'prospect_name', label: 'Client', type: 'text', placeholder: 'TechStart Inc' },
          { key: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'Sarah Chen' },
          { key: 'date', label: 'Proposal Date', type: 'date' },
          { key: 'valid_until', label: 'Valid Until', type: 'date' },
        ],
      },
      {
        heading: 'Proposed Services',
        hint: 'Each row becomes a service in the pricing table',
        fields: [
          { key: 'services', type: 'row', columns: ['Service', 'Specification'],
            defaults: [
              ['Payment Method', 'EMT (Electronic Money Transfer)'],
              ['Transaction Fee', '5%'],
              ['Settlement Terms', 'T+7 (7 business days)'],
              ['Delivery', 'Same day delivery'],
              ['Support', '24/7 custom support'],
              ['Volume Capacity', '10,000 transactions per month'],
            ]},
        ],
      },
      {
        heading: 'Terms and Conditions',
        hint: 'Each item becomes a bullet point in the terms section',
        fields: [
          { key: 'terms', type: 'list', placeholder: 'e.g. All cloud costs will be covered by the client',
            defaults: [
              'Cloud Infrastructure: All cloud costs will be covered by the client',
              'Contract Length: 12 months minimum',
              'Volume Discounts: Available for 50,000+ transactions/month',
            ]},
        ],
      },
    ],
  },
  {
    id: 'receipt',
    name: 'Receipt',
    desc: 'Confirm payment received',
    sections: [
      {
        heading: 'Receipt Details',
        hint: 'Appears as a details table at the top',
        fields: [
          { key: 'client_name', label: 'Client', type: 'text', placeholder: 'Acme Corp' },
          { key: 'receipt_number', label: 'Receipt #', type: 'text', placeholder: 'REC-001' },
          { key: 'date', label: 'Payment Date', type: 'date' },
          { key: 'payment_method', label: 'Payment Method', type: 'text', placeholder: 'Wire Transfer' },
        ],
      },
      {
        heading: 'Items Paid',
        hint: 'Each row becomes a line in the receipt',
        fields: [
          { key: 'items', type: 'row', columns: ['Description', 'Amount'],
            defaults: [
              ['EMT Processing Setup', '$2,500'],
            ]},
        ],
      },
      {
        heading: 'Notes',
        hint: 'Appears at the bottom',
        fields: [
          { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Thank you for your payment. Reference: TXN-98765' },
        ],
      },
    ],
  },
  {
    id: 'sow',
    name: 'Statement of Work',
    desc: 'Define project scope and deliverables',
    sections: [
      {
        heading: 'Project Overview',
        hint: 'Appears as the project summary',
        fields: [
          { key: 'client_name', label: 'Client', type: 'text', placeholder: 'Acme Corp' },
          { key: 'project_name', label: 'Project', type: 'text', placeholder: 'Payment Gateway Integration' },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'objectives', label: 'Objectives', type: 'textarea', placeholder: 'Integrate EMT and Card processing into client platform' },
        ],
      },
      {
        heading: 'Deliverables',
        hint: 'Each item becomes a deliverable bullet',
        fields: [
          { key: 'deliverables', type: 'list', placeholder: 'e.g. API integration for EMT processing',
            defaults: [
              'API integration for EMT processing',
              'Card payment gateway setup',
              'Admin dashboard access',
              'Technical documentation',
            ]},
        ],
      },
      {
        heading: 'Timeline',
        hint: 'Each row is a project phase',
        fields: [
          { key: 'timeline', type: 'row', columns: ['Phase', 'Duration', 'Description'],
            defaults: [
              ['Phase 1', 'Week 1-2', 'API setup & integration'],
              ['Phase 2', 'Week 3-4', 'Testing & QA'],
              ['Phase 3', 'Week 5', 'Go-live & handoff'],
            ]},
        ],
      },
      {
        heading: 'Pricing',
        hint: 'Each row is a cost line item',
        fields: [
          { key: 'pricing', type: 'row', columns: ['Item', 'Cost'],
            defaults: [
              ['Setup Fee', '$5,000'],
              ['Monthly Platform Fee', '$450/mo'],
            ]},
        ],
      },
    ],
  },
];

/* ── Template Grid ── */

function populateTemplates() {
  const grid = $('tpl-grid');
  grid.innerHTML = '';
  for (const tpl of TEMPLATES) {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.onclick = () => openTemplate(tpl);
    card.innerHTML = `
      <div class="tpl-icon">${ICONS[tpl.id] || ''}</div>
      <h3>${tpl.name}</h3>
      <p>${tpl.desc}</p>
    `;
    grid.appendChild(card);
  }
}

/* ── Build Form ── */

function openTemplate(tpl) {
  currentTemplate = tpl;
  $('tpl-form-title').textContent = tpl.name;
  $('tpl-form-desc').textContent = tpl.desc;
  const form = $('tpl-form');
  form.innerHTML = '';

  for (const sec of tpl.sections) {
    // Section header
    const header = document.createElement('div');
    header.className = 'form-section';
    header.innerHTML = `<h3>${sec.heading}</h3>${sec.hint ? `<p class="form-hint">${sec.hint}</p>` : ''}`;
    form.appendChild(header);

    for (const f of sec.fields) {
      if (f.type === 'payment') {
        form.appendChild(buildPaymentField(f));
      } else if (f.type === 'row') {
        form.appendChild(buildRowField(f));
      } else if (f.type === 'list') {
        form.appendChild(buildListField(f));
      } else {
        form.appendChild(buildSimpleField(f));
      }
    }
  }

  show('v-tpl-form');
}

/* ── Payment Method Picker ── */

const PAYMENT_METHODS = [
  { id: 'emt', label: 'Interac e-Transfer', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>' },
  { id: 'crypto', label: 'Crypto Wallet', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
  { id: 'wire', label: 'Wire Transfer', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
];

function buildPaymentField() {
  const wrap = document.createElement('div');
  wrap.className = 'payment-field';

  // Toggle buttons
  const toggles = document.createElement('div');
  toggles.className = 'payment-toggles';
  for (const m of PAYMENT_METHODS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'payment-toggle';
    btn.dataset.method = m.id;
    btn.innerHTML = `${m.icon}<span>${m.label}</span>`;
    btn.onclick = () => {
      btn.classList.toggle('active');
      updatePaymentFields(wrap);
    };
    toggles.appendChild(btn);
  }
  wrap.appendChild(toggles);

  // Dynamic fields container
  const fields = document.createElement('div');
  fields.className = 'payment-fields';
  wrap.appendChild(fields);

  return wrap;
}

function updatePaymentFields(wrap) {
  const fields = wrap.querySelector('.payment-fields');
  fields.innerHTML = '';

  const active = wrap.querySelectorAll('.payment-toggle.active');
  for (const btn of active) {
    const method = btn.dataset.method;

    if (method === 'emt') {
      const group = document.createElement('div');
      group.className = 'form-group payment-group';
      group.dataset.paymentMethod = 'emt';
      group.innerHTML = `<label>Interac e-Transfer Email</label>`;
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'payment_emt';
      input.dataset.key = 'payment_emt';
      input.className = 'tpl-input';
      input.placeholder = 'payments@company.com';
      group.appendChild(input);
      fields.appendChild(group);
    }

    if (method === 'crypto') {
      const group = document.createElement('div');
      group.className = 'form-group payment-group';
      group.dataset.paymentMethod = 'crypto';
      group.innerHTML = `<label>Crypto Wallet Address</label>`;
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'payment_crypto';
      input.dataset.key = 'payment_crypto';
      input.className = 'tpl-input';
      input.placeholder = '0x1a2b3c4d...';
      group.appendChild(input);
      fields.appendChild(group);
    }

    if (method === 'wire') {
      const rowField = buildRowField({
        key: 'payment_wire',
        label: 'Wire Transfer Details',
        type: 'row',
        columns: ['Field', 'Value'],
        defaults: [
          ['Business Legal Name', ''],
          ['Company Address', ''],
          ['Beneficiary Bank Name', ''],
          ['Bank Address', ''],
          ['SWIFT/BIC Code', ''],
          ['Account Number', ''],
        ],
      });
      rowField.dataset.paymentMethod = 'wire';
      fields.appendChild(rowField);
    }
  }
}

function buildSimpleField(f) {
  const group = document.createElement('div');
  group.className = 'form-group';

  if (f.label) {
    const label = document.createElement('label');
    label.textContent = f.label;
    group.appendChild(label);
  }

  let input;
  if (f.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = f.type || 'text';
  }
  input.name = f.key;
  input.dataset.key = f.key;
  input.className = 'tpl-input';
  if (f.placeholder) input.placeholder = f.placeholder;
  group.appendChild(input);
  return group;
}

function buildRowField(f) {
  const wrap = document.createElement('div');
  wrap.className = 'row-field';
  wrap.dataset.key = f.key;
  wrap.dataset.columns = JSON.stringify(f.columns);

  // Optional label above the row field
  if (f.label) {
    const lbl = document.createElement('label');
    lbl.className = 'row-label';
    lbl.textContent = f.label;
    wrap.appendChild(lbl);
  }

  // Column headers
  const headerRow = document.createElement('div');
  headerRow.className = 'row-header';
  for (const col of f.columns) {
    const span = document.createElement('span');
    span.textContent = col;
    headerRow.appendChild(span);
  }
  headerRow.appendChild(document.createElement('span')); // spacer for remove btn
  wrap.appendChild(headerRow);

  // Rows container
  const rowsContainer = document.createElement('div');
  rowsContainer.className = 'row-entries';
  wrap.appendChild(rowsContainer);

  // Pre-populate defaults
  const defaults = f.defaults || [f.columns.map(() => '')];
  for (const vals of defaults) {
    rowsContainer.appendChild(createRowEntry(f.columns, vals));
  }

  // Add row button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-row-btn';
  addBtn.textContent = '+ Add row';
  addBtn.onclick = () => {
    rowsContainer.appendChild(createRowEntry(f.columns));
  };
  wrap.appendChild(addBtn);

  return wrap;
}

function createRowEntry(columns, values) {
  const row = document.createElement('div');
  row.className = 'row-entry';
  for (let i = 0; i < columns.length; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = columns[i];
    input.value = (values && values[i]) || '';
    row.appendChild(input);
  }
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-row-btn';
  removeBtn.innerHTML = '&times;';
  removeBtn.onclick = () => {
    row.remove();
  };
  row.appendChild(removeBtn);
  return row;
}

function buildListField(f) {
  const wrap = document.createElement('div');
  wrap.className = 'list-field';
  wrap.dataset.key = f.key;

  const listContainer = document.createElement('div');
  listContainer.className = 'list-entries';
  wrap.appendChild(listContainer);

  const defaults = f.defaults || [''];
  for (const val of defaults) {
    listContainer.appendChild(createListEntry(f.placeholder, val));
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'add-row-btn';
  addBtn.textContent = '+ Add item';
  addBtn.onclick = () => {
    listContainer.appendChild(createListEntry(f.placeholder));
  };
  wrap.appendChild(addBtn);

  return wrap;
}

function createListEntry(placeholder, value) {
  const row = document.createElement('div');
  row.className = 'list-entry';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder || 'Item';
  input.value = value || '';
  row.appendChild(input);
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-row-btn';
  removeBtn.innerHTML = '&times;';
  removeBtn.onclick = () => row.remove();
  row.appendChild(removeBtn);
  return row;
}

/* ── Collect Form Data ── */

function collectFormData() {
  const data = {};

  // Simple fields
  document.querySelectorAll('#tpl-form .tpl-input').forEach(el => {
    if (el.value.trim()) data[el.dataset.key] = el.value.trim();
  });

  // Row fields → "col1: val1, col2: val2" per row
  document.querySelectorAll('#tpl-form .row-field').forEach(wrap => {
    const key = wrap.dataset.key;
    const columns = JSON.parse(wrap.dataset.columns);
    const rows = [];
    wrap.querySelectorAll('.row-entry').forEach(entry => {
      const inputs = entry.querySelectorAll('input');
      const vals = [];
      let hasVal = false;
      inputs.forEach((inp, i) => {
        vals.push(`${columns[i]}: ${inp.value.trim() || '—'}`);
        if (inp.value.trim()) hasVal = true;
      });
      if (hasVal) rows.push(vals.join(', '));
    });
    if (rows.length) data[key] = rows.join('\n');
  });

  // List fields → one per line
  document.querySelectorAll('#tpl-form .list-field').forEach(wrap => {
    const key = wrap.dataset.key;
    const items = [];
    wrap.querySelectorAll('.list-entry input').forEach(inp => {
      if (inp.value.trim()) items.push(inp.value.trim());
    });
    if (items.length) data[key] = items.join('\n');
  });

  return data;
}

function backToTemplates() {
  currentTemplate = null;
  result = null;
  show('v-tpl-pick');
}

async function submitTemplate(e) {
  if (e) e.preventDefault();
  if (!currentTemplate) return;

  const formData = collectFormData();
  const brandName = currentBrand ? currentBrand.name : 'DigiPay';

  show('v-tpl-loading');
  $('tpl-err').textContent = '';

  try {
    const r = await fetch('/api/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: currentTemplate.id,
        template_name: currentTemplate.name,
        fields: formData,
        brand_name: brandName,
      }),
    });
    let d;
    try { d = await r.json(); } catch (_) {
      throw new Error('Server returned an invalid response. Please try again.');
    }
    if (!r.ok) throw new Error(d.error || 'Generation failed');
    result = d;
    renderPreview($('tpl-preview'), result);
    show('v-tpl-result');
  } catch (e) {
    show('v-tpl-form');
    $('tpl-err').textContent = e.message;
    const btn = $('tpl-report-btn');
    if (btn) {
      btn.classList.remove('hide');
      btn.textContent = 'Report Bug';
      btn.disabled = false;
      _bugCtx['tpl-report-btn'] = { error: e.message, source_text: JSON.stringify(formData), context: 'template:' + currentTemplate.id };
    }
  }
}

/* ── Home: Build Brand Cards ── */

function populateBrandCards() {
  const grid = $('brand-grid');
  grid.innerHTML = '';
  for (const [id, brand] of Object.entries(BRANDS)) {
    const card = document.createElement('div');
    card.className = 'brand-card';
    card.style.setProperty('--card-accent', brand.accent);
    card.onclick = () => selectBrand(id);

    card.innerHTML = `
      <div class="brand-card-logo">
        <img src="${brand.logoWhite}" alt="${brand.name}">
      </div>
      <div class="brand-card-info">
        <h3>${brand.name}</h3>
        <p>${brand.tagline}</p>
      </div>
      <div class="brand-card-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    `;
    grid.appendChild(card);
  }
}

/* ── Init ── */

let initDone = false;

function initApp() {
  if (initDone) return;
  initDone = true;

  initUploadListeners();
  populateTemplates();
  populateBrandCards();

  // Check for hash route on load
  const hash = getHash();
  const brandId = hash.split('/')[0];
  if (hash !== 'home' && BRANDS[brandId]) {
    _skipHash = true;
    selectBrand(brandId);
    const tab = hash.split('/')[1];
    if (tab && tab !== 'convert') switchTab(tab);
    _skipHash = false;
  } else {
    populateBrandDropdown();
    startBrandCycle();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
if (document.readyState !== 'loading') initApp();
