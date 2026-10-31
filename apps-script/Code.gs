/**
 * Horizont LHB d.o.o. – upiti s www.horizont-lhb.hr + admin (admin.html)
 * Zalijepi u Google tablicu → Proširenja → Apps Script → Implementiraj kao Web app (Izvrši kao: Ja, Pristup: Svi).
 * Lozinku za admin upiši SAMO ovdje (ADMIN_KEY), nikad u GitHub repo.
 */
const NOTIFY_EMAIL = 'sbatinac@horizont-lhb.hr'; // na ovu adresu stižu upiti
const ADMIN_KEY = 'UPISI_LOZINKU';               // lozinka za admin.html
const SHEET_NAME = 'Upiti';
const SHEET_POSJETE = 'Posjete';
const NAZIV = 'Horizont LHB d.o.o.';
const TEL = '091 358 4122';
const WA = '385913584122';
const WEB = 'https://www.horizont-lhb.hr/';
const TZ = 'Europe/Zagreb';
const BOJA = '#16140F';
const TG_TOKEN = ''; // može ostati prazno: token se upisuje u adminu (⚙ Postavke → Telegram)

const POLJA = [
  ['nr', 'Broj upita'], ['vrijeme', 'Vrijeme'], ['jezik', 'Jezik'], ['tip', 'Pošiljatelj'], ['firma', 'Naziv poslovnog subjekta'], ['oib', 'OIB'],
  ['ime', 'Ime i prezime / kontakt osoba'], ['email', 'E-pošta'], ['telefon', 'Telefon'], ['grad', 'Grad'],
  ['podrucje', 'Područje'], ['kontakt_nacin', 'Kako kontaktirati'], ['poruka', 'Poruka']
];
const STATUSI = ['Novo', 'U obradi', 'Odgovoreno', 'Završeno', 'Arhiva'];

// ===== JAVNO =====
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d._vrsta === 'admin') return out(admin_(d));
    if (d.web) return out({ ok: true }); // zamka za robote
    if (!d.ime || !d.email || !d.poruka) return out({ ok: false, error: 'Nedostaju podaci.' });
    if (d.tip && d.tip !== 'Fizička osoba' && !oibOk_(d.oib)) return out({ ok: false, error: 'OIB nije ispravan.' });
    const ss = ss_(), sh = sheet_();
    d.nr = noviBroj_(sh);
    d.vrijeme = Utilities.formatDate(new Date(), TZ, 'dd.MM.yyyy. HH:mm');
    const row = POLJA.map(p => {
      const v = String(d[p[0]] || '').slice(0, 5000);
      return /^[+0][\d\s\/().-]*$/.test(v) && v ? "'" + v : v; // telefon / OIB ostaju tekst
    });
    sh.appendRow(row.concat('Novo', ''));
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL, replyTo: d.email, name: 'Horizont LHB – web',
        subject: 'Novi upit ' + d.nr + ': ' + (d.firma || d.ime) + (d.podrucje ? ' – ' + d.podrucje : ''),
        htmlBody: obavijest_(d, ss.getUrl()),
        body: POLJA.filter(p => d[p[0]]).map(p => p[1] + ': ' + d[p[0]]).join('\n') + '\n\nOdgovori direktno na ovaj mail (ide pošiljatelju).\nAdmin: ' + WEB + 'admin.html'
      });
    } catch (err) { console.warn(err); }
    try { tgNovo_(d); } catch (err) { console.warn(err); }
    try {
      const en = d.jezik === 'EN';
      MailApp.sendEmail({ to: d.email, name: NAZIV, replyTo: NOTIFY_EMAIL,
        subject: (en ? 'We received your enquiry ' : 'Primili smo Vaš upit ') + d.nr + ' – Horizont LHB',
        htmlBody: potvrda_(d, en),
        body: (en ? 'Thank you! We received your enquiry ' : 'Hvala! Zaprimili smo Vaš upit ') + d.nr + '. ' + TEL + ' · ' + WEB });
    } catch (err) { console.warn(err); }
    return out({ ok: true, nr: d.nr });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.a === 'hit') return out(hit_());
  return out({ ok: true, servis: 'horizont-lhb' });
}

// ===== ADMIN =====
function admin_(d) {
  if (!ADMIN_KEY || ADMIN_KEY === 'UPISI_LOZINKU' || d.k !== ADMIN_KEY) { Utilities.sleep(800); return { ok: false, error: 'Pogrešna lozinka.' }; }
  if (d.akcija === 'podaci') return { ok: true, upiti: table_(SHEET_NAME), posjete: table_(SHEET_POSJETE), tablica: ss_().getUrl(), telegram: tgInfo_(), brojac: brojacInfo_(), statusi: STATUSI };
  if (d.akcija === 'spremi') {
    const sh = sheet_(), row = rowByNr_(sh, d.nr);
    if (!row) return { ok: false, error: 'Upit ' + d.nr + ' nije pronađen.' };
    const f = {};
    if (d.status !== undefined) { if (STATUSI.indexOf(d.status) === -1) return { ok: false, error: 'Nepoznat status.' }; f['Status'] = d.status; }
    if (d.biljeska !== undefined) f['Bilješka'] = String(d.biljeska).slice(0, 5000);
    setFields_(sh, row, f);
    return { ok: true };
  }
  if (d.akcija === 'brisi') {
    if (d.lozinka !== ADMIN_KEY) { Utilities.sleep(800); return { ok: false, error: 'Pogrešna lozinka za potvrdu.' }; }
    const sh = sheet_(), nrs = Array.isArray(d.nrs) ? d.nrs : [d.nr];
    const rows = nrs.map(nr => rowByNr_(sh, nr)).filter(Boolean).sort((a, b) => b - a);
    if (!rows.length) return { ok: false, error: 'Upit nije pronađen.' };
    rows.forEach(row => sh.deleteRow(row));
    return { ok: true, obrisano: rows.length, brojac: brojacInfo_() };
  }
  if (d.akcija === 'brojac') {
    const sh = sheet_(), god = new Date().getFullYear(), od = Math.floor(Number(d.od));
    if (!(od >= 1 && od <= 9999)) return { ok: false, error: 'Upiši broj od 1 do 9999.' };
    if (brojeviGodine_(sh, god).indexOf(od) !== -1) return { ok: false, error: 'Broj UP-' + god + '-' + String(od).padStart(4, '0') + ' već postoji.' };
    PropertiesService.getScriptProperties().setProperty('brojac', JSON.stringify({ god, od }));
    return { ok: true, brojac: brojacInfo_() };
  }
  if (d.akcija === 'tg') return tgAdmin_(d);
  return { ok: false, error: 'Nepoznata akcija.' };
}

// ===== TABLICA =====
function ss_() {
  const a = SpreadsheetApp.getActiveSpreadsheet();
  if (a) return a;
  const P = PropertiesService.getScriptProperties(), id = P.getProperty('ssid');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  const s = SpreadsheetApp.create('Horizont LHB – upiti');
  P.setProperty('ssid', s.getId());
  return s;
}
function sheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(POLJA.map(p => p[1]).concat('Status', 'Bilješka'));
    sh.getRange(1, 1, 1, POLJA.length + 2).setFontWeight('bold').setBackground(BOJA).setFontColor('#F6D35B');
    sh.setFrozenRows(1);
  }
  return sh;
}
function rowByNr_(sh, nr) {
  if (!nr || sh.getLastRow() < 2) return 0;
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().flat();
  const i = v.indexOf(String(nr));
  return i === -1 ? 0 : i + 2;
}
function setFields_(sh, row, fields) {
  const H = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(k => {
    let i = H.indexOf(k);
    if (i === -1) { i = H.length; sh.getRange(1, i + 1).setValue(k).setFontWeight('bold').setBackground(BOJA).setFontColor('#F6D35B'); H.push(k); }
    const v = fields[k];
    sh.getRange(row, i + 1).setValue(typeof v === 'string' && /^[=+\-@]/.test(v) && !/^-?\d/.test(v) ? "'" + v : v);
  });
}
function table_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh || !sh.getLastRow()) return { headers: [], rows: [] };
  const v = sh.getDataRange().getDisplayValues();
  return { headers: v[0], rows: v.slice(1) };
}

// Brojevi upita: UP-GGGG-NNNN
function brojeviGodine_(sh, god) {
  const pre = 'UP-' + god + '-';
  return sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().flat()
    .filter(v => String(v).startsWith(pre)).map(v => +String(v).slice(pre.length) || 0) : [];
}
function sljedeciBroj_(sh) {
  const god = new Date().getFullYear(), N = brojeviGodine_(sh, god), P = PropertiesService.getScriptProperties();
  const rucno = JSON.parse(P.getProperty('brojac') || 'null');
  let n = rucno && rucno.god === god ? rucno.od : (N.length ? Math.max.apply(null, N) : 0) + 1;
  while (N.indexOf(n) !== -1) n++;
  return { god, n, zadnji: N.length ? Math.max.apply(null, N) : 0, rucno: !!(rucno && rucno.god === god) };
}
function noviBroj_(sh) {
  const s = sljedeciBroj_(sh);
  PropertiesService.getScriptProperties().deleteProperty('brojac');
  return 'UP-' + s.god + '-' + String(s.n).padStart(4, '0');
}
function brojacInfo_() { const s = sljedeciBroj_(sheet_()); return { god: s.god, zadnji: s.zadnji, sljedeci: s.n, rucno: s.rucno }; }

function hit_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = ss_();
    const sh = ss.getSheetByName(SHEET_POSJETE) || ss.insertSheet(SHEET_POSJETE);
    if (!sh.getLastRow()) { sh.appendRow(['Datum', 'Posjete']); sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground(BOJA).setFontColor('#F6D35B'); sh.setFrozenRows(1); }
    const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), last = sh.getLastRow();
    if (last > 1 && sh.getRange(last, 1).getDisplayValue() === today) { const c = sh.getRange(last, 2); c.setValue(Number(c.getValue() || 0) + 1); }
    else sh.appendRow(["'" + today, 1]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function oibOk_(s) {
  s = String(s || '').replace(/\D/g, '');
  if (!/^\d{11}$/.test(s)) return false;
  let a = 10; for (let i = 0; i < 10; i++) { a = (a + +s[i]) % 10; a = (a || 10) * 2 % 11; }
  return (11 - a) % 10 === +s[10];
}

// ===== TELEGRAM (po želji) =====
function tgProps_() { return PropertiesService.getScriptProperties(); }
function tgApi_(metoda, payload) {
  const t = tgProps_().getProperty('tg_token') || TG_TOKEN; if (!t) throw new Error('Telegram bot nije postavljen.');
  const r = UrlFetchApp.fetch('https://api.telegram.org/bot' + t + '/' + metoda, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true });
  const j = JSON.parse(r.getContentText() || '{}'); if (!j.ok) throw new Error('Telegram: ' + (j.description || r.getResponseCode())); return j.result;
}
function tgInfo_() { const p = tgProps_(); return { bot: p.getProperty('tg_bot') || '', povezan: !!p.getProperty('tg_chat') }; }
function tgZadnjiChat_() { const up = tgApi_('getUpdates', { limit: 50 }) || []; const m = up.map(u => u.message || u.edited_message || u.my_chat_member).filter(x => x && x.chat).pop(); return m ? String(m.chat.id) : ''; }
function tg_(txt, gumbi) {
  const chat = tgProps_().getProperty('tg_chat'); if (!chat) return;
  const body = { chat_id: chat, text: String(txt).slice(0, 3800), parse_mode: 'HTML', disable_web_page_preview: true };
  if (gumbi && gumbi.length) body.reply_markup = { inline_keyboard: [gumbi] };
  tgApi_('sendMessage', body);
}
function tgAdmin_(d) {
  const p = tgProps_();
  try {
    if (d.op === 'token') {
      const tok = String(d.token || '').trim(); if (!/^\d+:[\w-]{20,}$/.test(tok)) return { ok: false, error: 'Token ne izgleda ispravno (oblik 123456789:ABC…).' };
      p.setProperty('tg_token', tok); p.deleteProperty('tg_chat');
      try { const me = tgApi_('getMe'); p.setProperty('tg_bot', me.username || ''); } catch (e) { p.deleteProperty('tg_token'); return { ok: false, error: 'Telegram ne prihvaća token. Provjeri ga u BotFatheru.' }; }
      return { ok: true, telegram: tgInfo_() };
    }
    if (d.op === 'povezi') {
      const chat = tgZadnjiChat_();
      if (!chat) return { ok: false, error: 'Bot još nije dobio poruku. U Telegramu otvori @' + (p.getProperty('tg_bot') || 'bot') + ', pošalji mu /start pa opet klikni Poveži.' };
      p.setProperty('tg_chat', chat);
      tg_('✅ <b>Povezano!</b>\nOvdje stižu obavijesti o novim upitima s <b>horizont-lhb.hr</b>.');
      return { ok: true, telegram: tgInfo_() };
    }
    if (d.op === 'test') { if (!p.getProperty('tg_chat')) return { ok: false, error: 'Telegram još nije povezan.' }; tg_('📨 <b>Novi upit (proba)</b>\nHorizont LHB d.o.o.', [{ text: 'Otvori admin', url: WEB + 'admin.html' }]); return { ok: true }; }
    if (d.op === 'iskljuci') { ['tg_token', 'tg_chat', 'tg_bot'].forEach(k => p.deleteProperty(k)); return { ok: true, telegram: { bot: '', povezan: false } }; }
  } catch (e) { return { ok: false, error: e.message }; }
  return { ok: false, error: 'Nepoznata akcija.' };
}
function tgNovo_(d) {
  if (!tgProps_().getProperty('tg_chat')) return;
  const h = s => esc_(s);
  const L = ['📨 <b>Novi upit ' + h(d.nr) + '</b>', '<b>' + h(d.firma || d.ime) + '</b>' + (d.firma ? ' · ' + h(d.ime) + ' · OIB ' + h(d.oib) : '') + ' (' + h(d.tip) + ')',
    d.telefon ? '📞 ' + h(d.telefon) : '', '✉️ ' + h(d.email), d.podrucje ? '🎯 ' + h(d.podrucje) : '', d.kontakt_nacin ? '💬 ' + h(d.kontakt_nacin) : '',
    '\n' + h(String(d.poruka).slice(0, 700))];
  const tel = intl_(d.telefon), G = [{ text: '📂 Admin', url: WEB + 'admin.html' }];
  if (tel) G.push({ text: 'WhatsApp', url: 'https://wa.me/' + tel });
  tg_(L.filter(String).join('\n'), G);
}

// ===== E-MAIL PREDLOŠCI =====
function esc_(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function intl_(t) { const d = String(t || '').replace(/\D/g, ''); return d.startsWith('385') ? d : d.startsWith('0') ? '385' + d.slice(1) : d; }
function btn_(href, txt, bg, fg) { return `<td style="padding:4px"><a href="${href}" style="display:inline-block;background:${bg};color:${fg};font:bold 14px Arial,sans-serif;text-decoration:none;padding:12px 18px;border-radius:8px">${txt}</a></td>`; }
function okvir_(naslov, sadrzaj, podnozje) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc_(naslov)}</title></head>
<body style="margin:0;padding:0;background:#F4F0E6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F0E6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#16140F">
<tr><td style="background:#FFFFFF;line-height:0;border-bottom:1px solid #ECE5D6"><a href="${WEB}"><img src="${WEB}og.jpg" width="600" alt="Horizont LHB d.o.o." style="display:block;width:100%;max-width:600px;height:auto;border:0"></a></td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:#E3B23C;background-image:linear-gradient(90deg,#16140F,#6B5520 35%,#E3B23C 70%,#FFD96B)">&nbsp;</td></tr>
${sadrzaj}
<tr><td style="background:#16140F;padding:22px 28px;color:#B5AA90;font-size:12px;line-height:1.6">
<b style="color:#FFFFFF;font-size:13px">Horizont LHB d.o.o.</b> <span style="color:#F6D35B">· od ideje do poslovne prilike</span><br>
Ulica Izidora Kršnjavoga 15, 31000 Osijek · ${TEL} · <a href="${WEB}" style="color:#F6D35B;text-decoration:none">www.horizont-lhb.hr</a><br>
${podnozje}
</td></tr></table></td></tr></table></body></html>`;
}
function potvrda_(d, en) {
  const ime = (d.ime || '').split(' ')[0];
  const red = (k, v) => v ? `<tr><td style="padding:9px 14px;color:#6B6455;font-size:13px;border-bottom:1px solid #ECE5D6;width:38%">${esc_(k)}</td><td style="padding:9px 14px;font-size:14px;border-bottom:1px solid #ECE5D6"><b>${esc_(v)}</b></td></tr>` : '';
  const T = en
    ? { lbl: 'Enquiry received', hi: 'Thank you', txt: 'We have received your message and will get back to you shortly' + (d.kontakt_nacin ? ' via: <b>' + esc_(d.kontakt_nacin) + '</b>.' : '.'), nr: 'Enquiry no.', co: 'Company', ar: 'Area', fast: 'Need a faster answer? Contact us directly:', call: 'Call', site: 'Our website', foot: 'This is an automatic confirmation. Feel free to reply, your message comes straight to us.' }
    : { lbl: 'Upit zaprimljen', hi: 'Hvala', txt: 'Zaprimili smo Vašu poruku i javit ćemo Vam se uskoro' + (d.kontakt_nacin ? ' putem: <b>' + esc_(d.kontakt_nacin) + '</b>.' : '.'), nr: 'Broj upita', co: 'Poslovni subjekt', ar: 'Područje', fast: 'Želite brži odgovor? Javite nam se izravno:', call: 'Nazovite', site: 'Naša stranica', foot: 'Ovaj mail je automatska potvrda. Slobodno odgovorite na njega, poruka stiže izravno nama.' };
  const s = `
<tr><td style="padding:30px 28px 6px">
  <p style="margin:0 0 6px;font:bold 11px monospace;letter-spacing:2px;color:#9A6B00;text-transform:uppercase">${T.lbl} · ${esc_(d.nr)}</p>
  <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2">${T.hi}${ime ? ', ' + esc_(ime) : ''}!</h1>
  <p style="margin:0;font-size:15px;line-height:1.6;color:#3A352A">${T.txt}</p>
</td></tr>
<tr><td style="padding:20px 28px 4px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ECE5D6;border-radius:10px;overflow:hidden;background:#FAF7F0">
    ${red(T.nr, d.nr)}${red(T.co, d.firma)}${red(T.ar, d.podrucje)}
  </table>
</td></tr>
<tr><td style="padding:22px 24px 30px">
  <p style="margin:0 0 10px 4px;font-size:14px;color:#3A352A">${T.fast}</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    ${btn_('https://wa.me/' + WA + '?text=' + encodeURIComponent((en ? 'Hello, regarding enquiry ' : 'Pozdrav, vezano uz upit ') + d.nr), 'WhatsApp', '#16140F', '#F6D35B')}
    ${btn_('tel:+' + WA, T.call, '#E0A91E', '#16140F')}
    ${btn_(WEB + (en ? 'en.html' : ''), T.site, '#F4F0E6', '#16140F')}
  </tr></table>
</td></tr>`;
  return okvir_(T.lbl + ' ' + d.nr, s, T.foot);
}
function obavijest_(d, tablicaUrl) {
  const red = (k, v) => v ? `<tr><td style="padding:7px 12px;color:#6B6455;font-size:13px;border-bottom:1px solid #ECE5D6;width:36%;vertical-align:top">${esc_(k)}</td><td style="padding:7px 12px;font-size:14px;border-bottom:1px solid #ECE5D6;white-space:pre-wrap">${esc_(v)}</td></tr>` : '';
  const tel = intl_(d.telefon);
  const s = `
<tr><td style="padding:26px 28px 4px">
  <p style="margin:0 0 6px;font:bold 11px monospace;letter-spacing:2px;color:#9A6B00;text-transform:uppercase">Novi upit · ${esc_(d.nr)}</p>
  <h1 style="margin:0 0 6px;font-size:24px;line-height:1.2">${esc_(d.firma || d.ime)}</h1>
  <p style="margin:0;font-size:14px;color:#6B6455">${esc_(d.tip || '')}${d.podrucje ? ' · ' + esc_(d.podrucje) : ''}</p>
</td></tr>
<tr><td style="padding:16px 24px 4px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
  ${btn_(WEB + 'admin.html', 'Otvori admin', '#E0A91E', '#16140F')}
  ${tel ? btn_('https://wa.me/' + tel, 'WhatsApp', '#16140F', '#F6D35B') + btn_('tel:+' + tel, 'Nazovi', '#F4F0E6', '#16140F') : ''}
</tr></table></td></tr>
<tr><td style="padding:14px 28px 28px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ECE5D6;border-radius:10px;overflow:hidden">
    ${POLJA.filter(p => p[0] !== 'nr').map(p => red(p[1], d[p[0]])).join('')}
  </table>
  <p style="margin:14px 0 0;font-size:13px;color:#6B6455">Odgovor na ovaj mail ide izravno pošiljatelju. <a href="${tablicaUrl}" style="color:#9A6B00">Otvori tablicu</a></p>
</td></tr>`;
  return okvir_('Novi upit ' + d.nr, s, 'Obavijest s www.horizont-lhb.hr. Pošiljatelj je dobio automatsku potvrdu.');
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Pokreni jednom ručno (▶ Pokreni) da Google zatraži dozvole za tablicu i mail.
function odobriDozvole() { sheet_(); MailApp.getRemainingDailyQuota(); try { UrlFetchApp.fetch('https://api.telegram.org', { muteHttpExceptions: true }); } catch (e) {} Logger.log('Tablica: ' + ss_().getUrl()); }
