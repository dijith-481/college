/* =====================================================================
 * NPTEL / SWAYAM transcript downloader
 * ---------------------------------------------------------------------
 * HOW TO USE
 *   1. Log in to https://onlinecourses.nptel.ac.in and open ANY lesson of
 *      the course (e.g. the URL you gave me).
 *   2. Open DevTools (F12) -> Console tab.
 *   3. Paste this whole file, press Enter.
 *   4. When Chrome asks "Download multiple files?", click Allow.
 *
 * WHAT IT DOES
 *   - Reads the (login-gated) course outline -> all units & lessons.
 *   - For each lesson reads lesson.video_subtitles.
 *   - Fetches each English transcript through the site's own API.
 *   - Saves one folder of .txt (plain) + .vtt (raw) per lecture,
 *     zipped as noc26_cs177_transcripts.zip, plus a combined markdown file.
 *
 * Nothing is sent anywhere except the requests this site already makes.
 * ===================================================================== */
(async () => {
  /* ----------------------------- CONFIG ----------------------------- */
  const COURSE_ID = (location.pathname.match(/\/course\/([^\/?#]+)/) || [])[1] || 'noc26_cs177';
  const LANG_PREF = ['English', 'english', 'en'];   // preferred transcript language
  const CONCURRENCY = 4;          // parallel requests (be gentle)
  const LIMIT = 0;                // 0 = all lessons, else stop after N (for a quick test)
  const ZIP_NAME = `${COURSE_ID}_transcripts.zip`;
  const MD_NAME = `${COURSE_ID}_all_transcripts.md`;
  /* ------------------------------------------------------------------ */

  const origin = location.origin;
  const enc = new TextEncoder();
  const log = (...a) => console.log('%c[NPTEL]', 'color:#187AE2;font-weight:bold', ...a);
  const warn = (...a) => console.warn('%c[NPTEL]', 'color:#e0a000;font-weight:bold', ...a);

  const parseMaybeJson = (t) => { try { return JSON.parse(t); } catch { return t; } };
  const unwrap = (d) => {
    if (d && typeof d.payload === 'string') { try { return JSON.parse(d.payload); } catch { return d; } }
    return d;
  };
  const get = async (path) => {
    const r = await fetch(origin + path, { credentials: 'same-origin' });
    const t = await r.text();
    return { ok: r.ok, status: r.status, data: parseMaybeJson(t), text: t };
  };
  const decode = (s) => s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
                          .replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const safe = (s) => (s || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 90);

  /* --------------------------- 1. OUTLINE --------------------------- */
  log(`course_id = ${COURSE_ID}`);
  const out = await get(`/e-learning/api/courseoutline?course_id=${encodeURIComponent(COURSE_ID)}`);
  const data = unwrap(out.data);
  if (!data || (!data.units && !data.lessons)) {
    console.error('Could not load the course outline. Make sure you are logged in AND enrolled,', out);
    return;
  }
  const courseName = data.course_name || COURSE_ID;
  const units = data.units || {};
  const unitById = {};
  Object.values(units).forEach(u => { if (u && u.unit_id != null) unitById[u.unit_id] = u; });

  // group lessons by unit
  const byUnit = new Map();
  Object.values(data.lessons || {}).forEach(l => {
    if (!l || l.lesson_id == null) return;
    if (!byUnit.has(l.unit_id)) byUnit.set(l.unit_id, []);
    byUnit.get(l.unit_id).push(l);
  });
  for (const arr of byUnit.values()) arr.sort((a, b) => a.lesson_id - b.lesson_id);

  // preserve unit order from the outline, then any leftovers
  const orderedUnitIds = [
    ...Object.values(units).map(u => u.unit_id).filter(id => byUnit.has(id)),
    ...[...byUnit.keys()].filter(id => !unitById[id]),
  ];

  const lectures = [];
  let n = 0;
  for (const uid of orderedUnitIds) {
    for (const l of byUnit.get(uid)) {
      n++;
      if (LIMIT && n > LIMIT) break;
      lectures.push({
        idx: n,
        unitId: uid,
        lessonId: l.lesson_id,
        unitTitle: unitById[uid]?.title || `Unit ${uid}`,
        title: l.title || `Lesson ${l.lesson_id}`,
        videoId: l.video_id || l.video || '',
        subs: l.video_subtitles || null,     // sometimes already present in the outline
      });
    }
    if (LIMIT && n > LIMIT) break;
  }
  log(`found ${lectures.length} lessons across ${orderedUnitIds.length} units in "${courseName}"`);

  /* --------------------- 2. HELPERS (subs/vtt) ---------------------- */
  function pickLang(subs) {
    const keys = Object.keys(subs || {});
    if (!keys.length) return null;
    for (const p of LANG_PREF) {
      const k = keys.find(k => k.toLowerCase() === p.toLowerCase() || k.toLowerCase().startsWith(p.toLowerCase()));
      if (k) return k;
    }
    return keys[0];
  }
  function normalizeUrl(u) {
    if (typeof u !== 'string') return '';
    const m = u.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || u.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (m && !/\.(vtt|pdf)(\?|#|$)/i.test(u)) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    return u;
  }
  async function fetchVtt(url) {
    const r = await fetch(`${origin}/e-learning/api/transcript?vttUrl=${encodeURIComponent(url)}`, { credentials: 'same-origin' });
    const txt = await r.text();
    if (!r.ok) throw new Error(`transcript API ${r.status}: ${txt.slice(0, 120)}`);
    let j; try { j = JSON.parse(txt); } catch { return txt; }
    if (typeof j === 'string') return j;
    if (j && typeof j === 'object') {
      for (const k of ['content', 'payload', 'data', 'transcript', 'vtt', 'text', 'result']) {
        if (typeof j[k] === 'string') return j[k];
      }
      return JSON.stringify(j, null, 2);
    }
    return txt;
  }
  function vttToText(vtt) {
    if (!vtt || typeof vtt !== 'string') return '';
    const blocks = vtt.replace(/\r/g, '').replace(/^WEBVTT[^\n]*/m, '').split(/\n{2,}/);
    const paras = [];
    for (const b of blocks) {
      let lines = b.split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) continue;
      if (/^(NOTE|STYLE|REGION)\b/.test(lines[0].toUpperCase())) continue;
      lines = lines.filter(l => !/-->/.test(l) && !/^\d+$/.test(l) && !/^(Kind|Language):/i.test(l));
      if (!lines.length) continue;
      const text = decode(lines.join(' ').replace(/<[^>]+>/g, '')).trim();
      if (text) paras.push(text);
    }
    return paras.join('\n\n');
  }

  async function loadSubs(lec) {
    if (lec.subs) return lec.subs;
    const r = await get(`/e-learning/api/lesson?course_id=${encodeURIComponent(COURSE_ID)}&unit_id=${lec.unitId}&lesson_id=${lec.lessonId}`);
    const d = unwrap(r.data);
    if (!d || d.content === 'not visible' || !d.lesson) return null;
    let s = d.lesson.video_subtitles;
    if (typeof s === 'string') { try { s = JSON.parse(s); } catch { s = null; } }
    return s || null;
  }

  /* --------------------- 3. FETCH (with pool) ----------------------- */
  const results = new Array(lectures.length);
  let done = 0;
  async function worker() {
    while (true) {
      const i = results.findIndex(x => x === undefined);
      if (i === -1) break;
      const lec = lectures[i];
      try {
        const subs = await loadSubs(lec);
        if (!subs || !Object.keys(subs).length) { results[i] = { lec, status: 'no-transcript' }; }
        else {
          const lang = pickLang(subs);
          const url = normalizeUrl(subs[lang]);
          if (/\.pdf(\?|#|$)/i.test(url)) { results[i] = { lec, status: 'pdf-only', lang, url }; }
          else {
            const vtt = await fetchVtt(url);
            results[i] = { lec, status: 'ok', lang, url, vtt, text: vttToText(vtt) };
          }
        }
      } catch (e) {
        results[i] = { lec, status: 'error', error: String(e && e.message || e) };
      }
      done++;
      if (done % 5 === 0 || done === lectures.length) log(`fetched ${done}/${lectures.length}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, lectures.length) }, worker));

  /* ------------------------- 4. BUILD FILES ------------------------- */
  const files = [];               // {name, text}
  const md = [`# ${courseName}`, ``, `_${lectures.length} lessons · generated ${new Date().toISOString()}_`, ``];
  let ok = 0;
  for (const r of results) {
    const { lec } = r;
    md.push(`## ${lec.idx}. ${lec.unitTitle} — ${lec.title}`, '');
    if (r.status !== 'ok') {
      md.push(`_No transcript (${r.status}${r.error ? ': ' + r.error : ''})_`, '');
      continue;
    }
    ok++;
    const header = [
      `Course : ${courseName}`,
      `Unit   : ${lec.unitTitle}`,
      `Lesson : ${lec.title}`,
      `IDs    : unit=${lec.unitId} lesson=${lec.lessonId} video=${lec.videoId}`,
      `Lang   : ${r.lang}`,
      `Source : ${r.url}`,
      '',
    ].join('\n');
    const base = `${String(lec.idx).padStart(3, '0')}_u${lec.unitId}_l${lec.lessonId}_${safe(lec.title)}`;
    files.push({ name: `${base}.txt`, text: header + '\n' + r.text + '\n' });
    files.push({ name: `${base}.vtt`, text: r.vtt });
    md.push('```', header, r.text, '```', '');
  }
  files.push({ name: '00_all_transcripts.md', text: md.join('\n') });

  /* --------------------------- 5. ZIP ------------------------------- */
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
    return t;
  })();
  const crc32 = (u8) => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(entries) {
    const local = [], central = []; let offset = 0;
    for (const f of entries) {
      const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
      lh.set(name, 30); local.push(lh, data);
      const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
      ch.set(name, 46); central.push(ch);
      offset += lh.length + data.length;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const eocd = new Uint8Array(22), ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);
    return new Blob([...local, ...central, eocd], { type: 'application/zip' });
  }
  const download = (name, blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  };

  download(ZIP_NAME, zip(files));
  download(MD_NAME, new Blob([md.join('\n')], { type: 'text/markdown' }));

  /* --------------------------- 6. SUMMARY --------------------------- */
  const summary = results.map(r => ({ '#': r.lec.idx, unit: r.lec.unitTitle, lesson: r.lec.title, status: r.status, lang: r.lang || '-' }));
  console.table(summary);
  log(`DONE — ${ok}/${lectures.length} transcripts saved.`);
  log(`Downloads: ${ZIP_NAME} (${files.length} files incl. ${MD_NAME.replace('.md','')}) + ${MD_NAME}`);
  console.log('Full result object (keep this if anything failed):', results);
  window.__NPTEL_TRANSCRIPTS__ = results;
})();
