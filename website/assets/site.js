/* SATER website: shared behaviour. Product facts come from SATER's Instagram; anything unconfirmed says TBC. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (!calm) root.classList.add('js');

  const IG_DM = 'https://ig.me/m/saterr1';

  // Opened straight from disk, "./" shows a folder listing; point home links at index.html instead
  if (location.protocol === 'file:') $$('a[href="./"]').forEach(a => a.setAttribute('href', 'index.html'));

  // Mobile menu
  const toggle = $('.menu-toggle'), drawer = $('#drawer');
  if (toggle && drawer) {
    const setMenu = open => { drawer.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    toggle.addEventListener('click', () => setMenu(drawer.hidden));
    drawer.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); toggle.focus(); } });
  }

  // Header tone: teal while it sits over the night opener, cotton once the page turns to day
  const night = $('main > .night');
  const header = $('.site-header');
  if (night && header) {
    // As in V5: the middle of the header names the chapter you are reading, and a thin line shows how far you are
    const chapters = $$('main > [data-name]'), chap = $('#chap-name'), bar = $('.progress i'), first = chap?.textContent;
    const foot = $('.site-footer');
    const tone = () => {
      const h = header.offsetHeight + 8;
      const overFoot = foot && foot.getBoundingClientRect().top <= h;
      document.body.dataset.tone = overFoot || night.getBoundingClientRect().bottom > h ? 'dark' : 'light';
      if (chapters.length && chap) {
        let cur = null;
        for (const s of chapters) if (s.getBoundingClientRect().top <= innerHeight * .35) cur = s;
        chap.innerHTML = cur ? cur.dataset.name : first;
      }
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
    };
    addEventListener('scroll', () => requestAnimationFrame(tone), { passive: true });
    addEventListener('resize', tone); tone();
  }

  // Logo: the entrance plays V5's slow reveal on load; the footer plays V2's quicker one when it comes into view
  const play = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  if (!calm) {
    $$('.logo-anim[data-autoplay]').forEach(el => {
      play(el, 'play-entrance');
      el.addEventListener('click', () => play(el, 'play-entrance'));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(el, 'play-entrance'); } });
    });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { play(en.target, 'play'); io.unobserve(en.target); } }), { threshold: .05 });
      $$('.logo-anim[data-inview]').forEach(el => { io.observe(el); el.addEventListener('mouseenter', () => play(el, 'play')); });
    }
  }

  // Category rail arrows
  const rail = $('#rail');
  if (rail) {
    const btns = $$('[data-rail]');
    const step = () => (rail.querySelector('.card')?.offsetWidth || 300) + 16;
    btns.forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: step() * Number(b.dataset.rail), behavior: calm ? 'auto' : 'smooth' })));
    const sync = () => { btns[0].disabled = rail.scrollLeft < 4; btns[1].disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4; };
    rail.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
  }

  // Single-choice chip groups
  $$('.chips[data-single]').forEach(g => g.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip', g).forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    g.dispatchEvent(new CustomEvent('pick', { detail: c }));
  }));

  // Links to the policy open its panels
  $$('a[href$="#returns"]').forEach(a => a.addEventListener('click', () => $$('#returns details').forEach(d => d.open = true)));
  $$('[aria-disabled="true"]').forEach(el => el.addEventListener('click', e => e.preventDefault()));

  // Copy a prepared message; fall back to selecting it
  const copy = async ta => {
    try { await navigator.clipboard.writeText(ta.value); return true; }
    catch { ta.focus(); ta.select(); return false; }
  };

  /* ---------- Shop: filter by category ---------- */
  const filters = $('#filters');
  if (filters) {
    const cards = $$('.products .card');
    const count = $('#shown');
    const apply = cat => {
      let n = 0;
      cards.forEach(c => { const on = cat === 'all' || c.dataset.cat === cat; c.hidden = !on; if (on) n++; });
      $$('.chip', filters).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === cat)));
      if (count) count.textContent = n === 1 ? '1 product' : `${n} products`;
    };
    filters.addEventListener('pick', e => { const cat = e.detail.dataset.filter; apply(cat); history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat); });
    const start = location.hash.slice(1);
    if (start && $(`.chip[data-filter="${start}"]`, filters)) apply(start);
  }

  /* ---------- Product page ---------- */
  const PRODUCTS = {
    'bed-bumper': { en: 'Bed Bumper', ar: 'جوانب', cat: 'Bed Bumpers', catId: 'bumpers', mtm: true, tone: 't-blush',
      desc: 'Made to the measurements of your cot. Four styles, as shown on our Instagram.',
      photos: [['P2', 'Sponge bumper in a cot'], ['P3', 'Polygonal bumper'], ['P4', 'Bubbles bumper'], ['P5', 'Braided bumper']],
      styles: [['Sponge', 'سفنج'], ['Polygonal', 'مضلعة'], ['Bubbles', 'بابلز'], ['Braided', 'ضفيرة']] },
    'oval-nest': { en: 'Oval Nest', ar: 'نيست بيضاوي', cat: 'Baby Nests', catId: 'nests', tone: 't-sand',
      photos: [['P6', 'Oval nest, from above'], ['P6b', 'Oval nest, detail'], ['P6c', 'Oval nest, in use']] },
    'round-nest': { en: 'Round Nest', ar: 'نيست دائري', cat: 'Baby Nests', catId: 'nests', tone: 't-muslin',
      photos: [['P7', 'Round nest, from above'], ['P7b', 'Round nest, detail'], ['P7c', 'Round nest, in use']] },
    'muslin-cover': { en: 'Muslin Cover', ar: '', cat: 'Muslin Covers', catId: 'muslin', tone: 't-muslin',
      photos: [['P8', 'Muslin cover, folded'], ['P8b', 'Muslin cover, in use']] },
    'playmat': { en: 'Playmat', ar: 'بلاي مات', cat: 'Playmats', catId: 'playmats', tone: 't-clay',
      photos: [['P9', 'Playmat, laid flat'], ['P9b', 'Playmat, in use']] },
    'organiser': { en: 'Organiser', ar: 'منظمات', cat: 'Organisers', catId: 'organisers', tone: 't-sand',
      photos: [['P10', 'Organiser, filled'], ['P10b', 'Organiser, detail']] },
    'bort': { en: '', ar: 'بورط', cat: 'بورط', catId: 'bort', tone: 't-blush',
      photos: [['P11', 'Product to confirm']] }
  };
  const pd = $('#pd');
  if (pd) {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ph = (tone, code, what) => `<div class="ph ${tone}"><div class="ph-in"><span class="ph-kind">Photo ${esc(code)}</span>${what ? `<span class="ph-what">${esc(what)}</span>` : ''}</div></div>`;
    let style = '';
    const name = p => p.en ? (p.ar ? `${p.en} (${p.ar})` : p.en) : p.ar;
    const msg = (p) => `Hello SATER 🤍\nI'd like to ask about the ${name(p)}${style ? `, ${style} style` : ''}.\nCould you send me the price, sizes and delivery details?\nThank you`;

    const render = id => {
      const p = PRODUCTS[id] || PRODUCTS['bed-bumper'];
      id = PRODUCTS[id] ? id : 'bed-bumper';
      style = p.styles ? p.styles[0][0] : '';
      document.title = `${p.en || p.ar} · SATER`;
      $('#pd-crumb-cat').innerHTML = `<a href="shop.html#${p.catId}">${esc(p.cat)}</a>`;
      $('#pd-crumb-name').textContent = p.en || p.ar;
      $('#pd-cat').textContent = p.cat;
      $('#pd-title').innerHTML = p.en ? `<span>${esc(p.en)}</span>${p.ar ? `<span lang="ar">${esc(p.ar)}</span>` : ''}` : `<span lang="ar">${esc(p.ar)}</span>`;
      $('#pd-desc').innerHTML = p.desc ? esc(p.desc) : `Details from SATER <span class="tbc">TBC</span>`;
      $('#pd-main').innerHTML = ph(p.tone, p.photos[0][0], p.photos[0][1]);
      $('#pd-thumbs').innerHTML = p.photos.length > 1 ? p.photos.map((f, i) => `<button type="button" aria-pressed="${i === 0}" aria-label="Show photo: ${esc(f[1])}" data-i="${i}">${ph(p.tone, f[0], '')}</button>`).join('') : '';
      $('#pd-thumbs').hidden = p.photos.length < 2;
      $('#pd-thumbs').onclick = e => {
        const b = e.target.closest('button'); if (!b) return;
        $$('button', $('#pd-thumbs')).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        const f = p.photos[+b.dataset.i]; $('#pd-main').innerHTML = ph(p.tone, f[0], f[1]);
      };
      const st = $('#pd-styles');
      st.hidden = !p.styles;
      if (p.styles) {
        $('#pd-style-chips').innerHTML = p.styles.map((s, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-style="${esc(s[0])}" data-i="${i}">${esc(s[0])} <span lang="ar">${esc(s[1])}</span></button>`).join('');
      }
      $('#pd-mtm').innerHTML = p.mtm ? 'Made to your cot’s inner length and width' : 'Sizes <span class="tbc">TBC</span>';
      $('#pd-ask').textContent = p.mtm ? 'Have a question first? Your message to us is ready:' : 'Ask us about it on Instagram. Your message is ready:';
      $('#pd-request').parentElement.hidden = !p.mtm;
      $('#pd-request').href = 'made-to-measure.html' + (style ? '#' + style.toLowerCase() : '');
      $('#pd-msg').value = msg(p);
      $('#pd-status').textContent = '';
      $$('.related .card').forEach(c => c.hidden = c.dataset.id === id);
      pd.dataset.id = id;
    };
    $('#pd-style-chips').addEventListener('pick', e => {
      const p = PRODUCTS[pd.dataset.id]; style = e.detail.dataset.style;
      const f = p.photos[+e.detail.dataset.i]; if (f) { $('#pd-main').innerHTML = ph(p.tone, f[0], f[1]); $$('button', $('#pd-thumbs')).forEach((x, i) => x.setAttribute('aria-pressed', String(i === +e.detail.dataset.i))); }
      $('#pd-request').href = 'made-to-measure.html#' + style.toLowerCase();
      $('#pd-msg').value = msg(p);
    });
    $('#pd-copy').addEventListener('click', async () => {
      const ok = await copy($('#pd-msg'));
      $('#pd-status').textContent = ok ? 'Message copied. Open Instagram and paste it into a message to @saterr1.' : 'Message selected. Copy it, then paste it into a message to @saterr1.';
    });
    render(location.hash.slice(1));
    addEventListener('hashchange', () => { render(location.hash.slice(1)); scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); });
  }

  /* ---------- Made-to-measure request: four short steps, then one message to send ---------- */
  const form = $('#req');
  if (form) {
    const sets = $$('fieldset[data-step]', form), bar = $$('.progress-steps li', form);
    const back = $('#req-back'), next = $('#req-next'), copyBtn = $('#req-copy'), igBtn = $('#req-ig');
    const names = ['style', 'size', 'contact details', 'review'];
    let s = 1;
    const val = n => (form.elements[n]?.value || '').trim();
    const setErr = (id, text) => { const p = $('#err-' + id); if (p) p.textContent = text; const f = p?.closest('.field'); if (f) f.toggleAttribute('data-invalid', !!text); };
    const num = v => { const n = parseFloat(v.replace(',', '.')); return isFinite(n) ? n : NaN; };
    const check = step => {
      let ok = true;
      if (step === 1) { const v = val('style'); setErr('style', v ? '' : 'Choose a bumper style to continue.'); ok = !!v; }
      if (step === 2) {
        [['len', 'length', 'length'], ['wid', 'width', 'width']].forEach(([id, n, word]) => {
          const x = num(val(n));
          const e = !val(n) ? `Enter the inner ${word} in centimetres.` : (isNaN(x) || x < 30 || x > 300) ? `Enter the ${word} in centimetres, for example 120.` : '';
          setErr(id, e); if (e) ok = false;
        });
      }
      if (step === 3) {
        const n = val('name'), c = val('contact');
        setErr('name', n ? '' : 'Add your name so we know who the request is from.');
        setErr('contact', c.length >= 3 ? '' : 'Add a phone number or Instagram username so we can reply.');
        ok = !!n && c.length >= 3;
      }
      if (!ok) { const bad = $('[data-invalid] input, #err-style:not(:empty)', sets[step - 1]); (bad?.tagName === 'INPUT' ? bad : $('input', sets[step - 1]))?.focus(); }
      return ok;
    };
    const message = () => [
      'Hello SATER 🤍',
      'I would like to request a made-to-measure bed bumper.',
      '',
      `Style: ${val('style')}`,
      `Cot inner size: ${val('length')} × ${val('width')} cm`,
      val('notes') ? `Notes: ${val('notes')}` : '',
      '',
      `Name: ${val('name')}`,
      `Contact: ${val('contact')}`
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
    const show = n => {
      s = n;
      sets.forEach((f, i) => f.hidden = i !== s - 1);
      bar.forEach((li, i) => { li.className = i < s - 1 ? 'done' : i === s - 1 ? 'now' : ''; li.toggleAttribute('aria-current', i === s - 1); });
      back.hidden = s === 1; next.hidden = s === 4; copyBtn.hidden = igBtn.hidden = s !== 4;
      $('#step-status').textContent = `Step ${s} of 4: ${names[s - 1]}`;
      if (s === 4) {
        const rows = [['Style', val('style')], ['Inner size', `${val('length')} × ${val('width')} cm`], ['Notes', val('notes') || '—'], ['Name', val('name')], ['Contact', val('contact')]];
        $('#summary').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd></dd>`).join('');
        $$('#summary dd').forEach((dd, i) => dd.textContent = rows[i][1]);
        $('#req-msg').value = message(); $('#req-status').textContent = '';
      }
    };
    next.addEventListener('click', () => { if (check(s)) { show(s + 1); $('legend', sets[s - 1])?.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' }); } });
    back.addEventListener('click', () => show(s - 1));
    copyBtn.addEventListener('click', async () => {
      const ok = await copy($('#req-msg'));
      $('#req-status').textContent = ok ? 'Request copied. Open Instagram and paste it into a message to @saterr1.' : 'Request selected. Copy it, then paste it into a message to @saterr1.';
    });
    form.addEventListener('change', e => { if (e.target.name === 'style') setErr('style', ''); });
    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next.hidden ? copyBtn.click() : next.click(); } });
    // Arriving from a product page with a style already chosen
    const pre = location.hash.slice(1);
    const r = pre && $(`input[name="style"][data-id="${pre}"]`, form);
    if (r) r.checked = true;
    igBtn.href = IG_DM;
    show(1);
  }
})();
