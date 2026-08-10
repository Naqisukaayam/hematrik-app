export function fmtFull(d = new Date()) {
  return d instanceof Date
    ? d.toLocaleString('id-ID', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })
    : String(d).replace('T',' ').slice(0,19);
}

export function fmtShort(str) {
  if (!str) return '-';
  try {
    const d = new Date(str);
    if (isNaN(d)) return str.slice(0,19);
    return d.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return str.slice(0,19); }
}

export function fmtTime(str) {
  if (!str) return '-';
  try { return new Date(str).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); }
  catch { return str.slice(11,16); }
}

export function fmtCountdown(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2,'0');
}
