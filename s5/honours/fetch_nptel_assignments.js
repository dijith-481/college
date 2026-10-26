/* =====================================================================
 * NPTEL / SWAYAM  assignment-question downloader
 * ---------------------------------------------------------------------
 * Same as the transcript script: log in, open any lesson page of the
 * course, open DevTools (F12) -> Console, paste this, press Enter.
 *
 * It reads the course outline -> finds every assignment (assessment),
 * fetches each one, formats the questions (with the correct options,
 * since the API includes them) and downloads:
 *   - noc26_cs177_assignments.zip  (.md + .json per assignment)
 *   - noc26_cs177_all_assignments.md
 *
 * Nothing is sent anywhere except the site's own API.
 * ===================================================================== */
(async () => {
  /* ----------------------------- CONFIG ----------------------------- */
  const COURSE_ID = (location.pathname.match(/\/course\/([^\/?#]+)/) || [])[1] || 'noc26_cs177';
  const ZIP_NAME = `${COURSE_ID}_assignments.zip`;
  const MD_NAME  = `${COURSE_ID}_all_assignments.md`;
  /* ------------------------------------------------------------------ */

  const origin = location.origin;
  const enc = new TextEncoder();
  const log  = (...a) => console.log('%c[NPTEL]', 'color:#187AE2;font-weight:bold', ...a);
  const parseMaybeJson = t => { try { return JSON.parse(t); } catch { return t; } };
  const unwrap = d => { if (d && typeof d.payload === 'string') { try { return JSON.parse(d.payload); } catch { return d; } } return d; };
  const get = async p => { const r = await fetch(origin + p, { credentials: 'same-origin' }); const t = await r.text(); return { ok: r.ok, status: r.status, data: parseMaybeJson(t), text: t }; };
  const safe = s => (s || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 90);
  function htmlToText(h) {
    if (!h) return '';
    return String(h)
      .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
      .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  const imagesIn = h => {
    const out = [];
    String(h || '').replace(/<img[^>]+src=["']?([^"'\s>]+)/gi, (_, u) => { out.push(u); return _; });
    return out;
  };

  /* --------------------------- 1. OUTLINE --------------------------- */
  log(`course_id = ${COURSE_ID}`);
  const out = await get(`/e-learning/api/courseoutline?course_id=${encodeURIComponent(COURSE_ID)}`);
  const data = unwrap(out.data);
  if (!data || !Array.isArray(data.assessments)) {
    console.error('Could not read the course outline (assessments). Logged in AND enrolled?', out);
    return;
  }
  const courseName = data.course_name || COURSE_ID;
  const units = data.units || {}, unitTitle = {};
  Object.values(units).forEach(u => { if (u && u.unit_id != null) unitTitle[u.unit_id] = u.title; });

  const assessments = data.assessments.slice();
  log(`found ${assessments.length} assessments in "${courseName}"`);

  /* --------------------- 2. FETCH EACH ASSESSMENT ------------------- */
  const results = [];
  for (let i = 0; i < assessments.length; i++) {
    const a = assessments[i];
    // correct params: unit_id = a.id, assessment_id = a.unit_id  (matches the app)
    const unitId = a.id, assessId = a.unit_id;
    const label = a.title || a.assessment_title || `Assignment ${i + 1}`;
    try {
      const r = await get(`/e-learning/api/assessment?course_id=${encodeURIComponent(COURSE_ID)}&unit_id=${unitId}&assessment_id=${assessId}`);
      const d = unwrap(r.data);
      if (!d || d.content === 'not visible' || !d.assessment_data) {
        results.push({ a, label, unitId, assessId, status: 'no-data', raw: d });
      } else {
        results.push({ a, label, unitId, assessId, status: 'ok', d, questions: d.assessment_data.visible_questions || [] });
      }
    } catch (e) {
      results.push({ a, label, unitId, assessId, status: 'error', error: String(e && e.message || e) });
    }
    log(`fetched ${i + 1}/${assessments.length}: ${label}`);
  }

  /* ------------------------- 3. FORMAT FILES ------------------------ */
  const files = [], md = [`# ${courseName} — Assignments`, '', `_${assessments.length} assignments · ${new Date().toISOString()}_`, ''];
  let totalQ = 0;

  for (const r of results) {
    md.push(`# ${r.label}`, '');
    md.push(`- IDs: \`unit_id=${r.unitId}&assessment_id=${r.assessId}\``);
    if (r.d && r.d.due_date) md.push(`- Due: ${r.d.due_date}`);
    md.push('');

    if (r.status !== 'ok') {
      md.push(`_Could not load (${r.status}${r.error ? ': ' + r.error : ''})_`, '');
      files.push({ name: `${safe(r.label)}.json`, text: JSON.stringify(r.raw ?? { error: r.error }, null, 2) });
      continue;
    }
    totalQ += r.questions.length;

    r.questions.forEach((q, qi) => {
      const numText = q.question_number ?? q.display_number ?? (qi + 1);
      const tags = [q.description, q.points != null ? `${q.points} pt` : null, q.input_type].filter(Boolean).join(' · ');
      md.push(`## Q${numText}  _(${tags})_`, '');
      md.push(htmlToText(q.question_text) || '(no text)', '');
      const imgs = imagesIn(q.question_text);
      if (imgs.length) { md.push('Images:'); imgs.forEach(u => md.push(`  ![](${u})`)); md.push(''); }

      if (Array.isArray(q.choices) && q.choices.length) {
        q.choices.forEach(c => {
          const correct = Number(c.score || 0) > 0;
          md.push(`- ${correct ? '**[✓]**' : '[ ]'} ${htmlToText(c.text)}`);
        });
        md.push('');
        const ans = q.choices.filter(c => Number(c.score || 0) > 0).map(c => htmlToText(c.text)).join(' | ');
        if (ans) md.push(`**Answer:** ${ans}`);
      } else {
        // text / number / array questions
        const ans = q.accepted_answer_text
          || (Array.isArray(q.response) ? q.response.join(' | ') : q.response)
          || (q.range_from != null ? `${q.range_from} – ${q.range_to}` : null);
        if (ans) md.push(`**Answer:** ${htmlToText(String(ans))}`);
      }
      md.push('');
    });

    // per-assignment files
    files.push({ name: `${safe(r.label)}.md`, text: md.slice(md.lastIndexOf(`# ${r.label}`)).join('\n') + '\n' });
    files.push({ name: `${safe(r.label)}.json`, text: JSON.stringify(r.d, null, 2) });
  }
  files.push({ name: '00_all_assignments.md', text: md.join('\n') });

  /* --------------------------- 4. ZIP ------------------------------- */
  const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(entries) {
    const local = [], central = []; let offset = 0;
    for (const f of entries) {
      const name = enc.encode(f.name), d = enc.encode(f.text), crc = crc32(d);
      const lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true); lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, d.length, true); lv.setUint32(22, d.length, true); lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true);
      lh.set(name, 30); local.push(lh, d);
      const ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true); cv.setUint32(20, d.length, true); cv.setUint32(24, d.length, true); cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
      ch.set(name, 46); central.push(ch); offset += lh.length + d.length;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0), eocd = new Uint8Array(22), ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);
    return new Blob([...local, ...central, eocd], { type: 'application/zip' });
  }
  const download = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10000); };

  download(ZIP_NAME, zip(files));
  download(MD_NAME, new Blob([md.join('\n')], { type: 'text/markdown' }));

  /* --------------------------- 5. SUMMARY --------------------------- */
  console.table(results.map(r => ({ assignment: r.label, unit_id: r.unitId, assessment_id: r.assessId, status: r.status, questions: r.questions ? r.questions.length : 0 })));
  log(`DONE — ${totalQ} questions across ${results.filter(r => r.status === 'ok').length}/${assessments.length} assignments.`);
  log(`Downloads: ${ZIP_NAME} + ${MD_NAME}`);
  window.__NPTEL_ASSIGNMENTS__ = results;
})();
