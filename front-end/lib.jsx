/* ============================================================
   VERDA · lib.jsx — icons, formatters, chain config, context
   ============================================================ */

/* ---------- Tiny line-icon set (simple geometry only) ---------- */
const I = {
  wallet:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a2 2 0 0 1 2 2v1"/><path d="M3 7v10a2.5 2.5 0 0 0 2.5 2.5H19a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 6.5"/><circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" stroke="none"/></svg>,
  bank:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3 20h18"/></svg>,
  users:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17 14.2a5.5 5.5 0 0 1 3.5 4.8"/></svg>,
  trend:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15l5-5 3.5 3.5L20 6"/><path d="M20 11V6h-5"/></svg>,
  arrowUp:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>,
  arrowDn:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>,
  coins:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="9" cy="7" rx="5.5" ry="3"/><path d="M3.5 7v5c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3V7"/><path d="M14.5 11.2c2.4.3 4 1.4 4 2.8 0 1.7-2.5 3-5.5 3-1 0-2-.15-2.8-.4"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>,
  clock:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>,
  bolt:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3 5 13h6l-1 8 8-10h-6z"/></svg>,
  sun:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
  moon:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>,
  x:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  ext:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13.5V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/></svg>,
  alert:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".4" fill="currentColor"/><path d="M10.3 4.2 3.4 16a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  swap:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13M14 5l3 3-3 3"/><path d="M20 16H7M10 13l-3 3 3 3"/></svg>,
  doc:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M13 3v5h5M8 13h8M8 17h5"/></svg>,
  spark:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>,
  refresh:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 0 0-14-4.5L4 8M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14 4.5L20 16M20 20v-4h-4"/></svg>,
  flask:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6l-4.5 8a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.5 14h9"/></svg>,
  logo:     <svg viewBox="0 0 24 24" fill="none"><path d="M5 13.5c4 0 6-2 7-5.5 1 3.5 3 5.5 7 5.5-4 1-6 3-7 6.5-1-3.5-3-5.5-7-6.5z" fill="currentColor"/></svg>,
};

/* ---------- Chain configuration ---------- */
const CHAINS = {
  ethereum: {
    id: 'ethereum', name: 'Ethereum', symbol: 'ETH', wallet: 'MetaMask',
    walletShort: 'MetaMask', network: 'Mainnet', explorer: 'etherscan.io',
    explorerName: 'Etherscan', color: '#627EEA',
    address: '0x4F2A9C7b1E3d6F8a04C25b9D1aE73F0c4d8B89C1',
    balance: 3.2048, decimals: 4,
    portfolio: { invested: 2.5, returns: 0.34 },
    protocol: { tvl: 15.82, investors: 28, apr: 11.4 },
    feedAddrs: ['0x9aE2…41bD', '0x77C0…0fA3', '0x12Fe…cc81', '0x4F2A…89C1', '0xBea9…7712', '0x0d3C…9901'],
  },
  solana: {
    id: 'solana', name: 'Solana', symbol: 'SOL', wallet: 'Phantom',
    walletShort: 'Phantom', network: 'Mainnet Beta', explorer: 'solscan.io',
    explorerName: 'Solscan', color: '#9945FF',
    address: '7Xk9rQm3PvT2bN8yLfWZ1aHcEoUg4dSj6KpRnQm3PvT',
    balance: 142.6, decimals: 2,
    portfolio: { invested: 96.0, returns: 12.4 },
    protocol: { tvl: 842.5, investors: 113, apr: 13.2 },
    feedAddrs: ['7Xk9…3PvT', 'BvN2…q1Lc', '9Pfa…Zz04', 'Dm4K…7wRt', 'Ho2L…m3P1', 'Qp8s…vAa9'],
  },
};

/* ---------- Formatters ---------- */
function fmtNum(n, dp = 4) {
  if (n == null || isNaN(n)) return '0';
  const v = Number(n);
  const s = v.toLocaleString('en-US', { minimumFractionDigits: dp >= 2 ? 2 : 0, maximumFractionDigits: dp });
  return s;
}
function shortAddr(a, head = 6, tail = 4) {
  if (!a) return '';
  if (a.length <= head + tail) return a;
  return a.slice(0, head) + '…' + a.slice(-tail);
}
function fakeHash() {
  const hex = '0123456789abcdef';
  let s = '0x';
  for (let i = 0; i < 64; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}
function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
/* deterministic-ish colored blob from address (for identicon dot) */
function blobStyle(addr) {
  let h = 0;
  for (let i = 0; i < (addr || 'x').length; i++) h = (h * 31 + addr.charCodeAt(i)) % 360;
  return { background: `linear-gradient(135deg, oklch(0.7 0.15 ${h}), oklch(0.6 0.16 ${(h + 60) % 360}))` };
}

/* ---------- Sparkline path generator ---------- */
function sparkPath(points, w, h, pad = 2) {
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  return points.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (p - min) / range);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}
function genSeries(base, n = 28, vol = 0.04) {
  const pts = []; let v = base * 0.82;
  for (let i = 0; i < n; i++) {
    v += (base - v) * 0.08 + (Math.random() - 0.42) * base * vol;
    pts.push(Math.max(0, v));
  }
  pts[n - 1] = base;
  return pts;
}

/* ---------- Shared context ---------- */
window.DAppCtx = React.createContext(null);

/* ---------- Export ---------- */
Object.assign(window, {
  I, CHAINS, fmtNum, shortAddr, fakeHash, nowTime, blobStyle, sparkPath, genSeries,
});
