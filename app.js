const PIECES = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
};

const S = {
  view: 'home',
  forcing: { idx: 0, chess: null, found: new Set(), total: 0,
             selected: null, timeLeft: 180, timerId: null,
             running: false, ended: false },
  chaos: { idx: 0, chess: null, picks: [], selected: null, revealed: false }
};

function coordToSq(f, r) { return 'abcdefgh'[f] + (8 - r); }

function renderBoard(el, chess, opts = {}) {
  const { selected = null, highlights = {}, onSquare = null, flip = false } = opts;
  const board = chess.board();
  el.innerHTML = '';
  const ranks = flip ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  const files = flip ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];
  for (const r of ranks) {
    for (const f of files) {
      const sq = document.createElement('div');
      const name = coordToSq(f, r);
      sq.className = 'sq ' + ((r + f) % 2 === 0 ? 'light' : 'dark');
      if (selected === name) sq.classList.add('selected');
      if (highlights[name]) sq.classList.add('hl-' + highlights[name]);
      const p = board[r][f];
      if (p) {
        const span = document.createElement('span');
        span.className = 'piece ' + p.color;
        span.textContent = PIECES[p.color + p.type.toUpperCase()];
        sq.appendChild(span);
      }
      if (onSquare) sq.addEventListener('click', () => onSquare(name));
      el.appendChild(sq);
    }
  }
}

function formatTime(sec) {
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}

function computeForcingMoves(chess) {
  const out = [];
  for (const m of chess.moves({ verbose: true })) {
    const cap = m.flags.includes('c') || m.flags.includes('e');
    const chk = m.san.includes('+') || m.san.includes('#');
    if (cap || chk) out.push({ from: m.from, to: m.to, san: m.san, cap, chk });
  }
  return out;
}

// --- NAV ---
function showView(name) {
  S.view = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  document.getElementById('view-' + name).classList.add('active');
  if (name === 'forcing') initForcing();
  if (name === 'chaos') initChaos();
}
document.querySelectorAll('nav button').forEach(b =>
  b.addEventListener('click', () => showView(b.dataset.tab)));

// --- FORCING SCANNER ---
function initForcing() {
  const F = S.forcing;
  const pos = FORCING_POSITIONS[F.idx % FORCING_POSITIONS.length];
  F.chess = new Chess(pos.fen);
  F.found = new Set();
  F.selected = null;
  F.running = false;
  F.ended = false;
  F.timeLeft = pos.timeLimit || 180;
  if (F.timerId) { clearInterval(F.timerId); F.timerId = null; }
  F.total = computeForcingMoves(F.chess).length;
  document.getElementById('forcing-time').textContent = formatTime(F.timeLeft);
  document.getElementById('forcing-found').textContent = '0';
  document.getElementById('forcing-total').textContent = '?';
  document.getElementById('forcing-start').disabled = false;
  document.getElementById('forcing-done').disabled = true;
  document.getElementById('forcing-next').disabled = true;
  document.getElementById('forcing-result').style.display = 'none';
  renderForcing();
}

function renderForcing() {
  const F = S.forcing;
  if (!F.chess) return;
  const highlights = {};
  for (const key of F.found) highlights[key.slice(2)] = 'found';
  renderBoard(document.getElementById('forcing-board'), F.chess, {
    selected: F.selected, highlights, onSquare: onForcingSquare
  });
  document.getElementById('forcing-found').textContent = F.found.size;
}

function onForcingSquare(sq) {
  const F = S.forcing;
  if (!F.running || F.ended) return;
  if (!F.selected) {
    const p = F.chess.get(sq);
    if (p && p.color === F.chess.turn()) { F.selected = sq; renderForcing(); }
    return;
  }
  if (sq === F.selected) { F.selected = null; renderForcing(); return; }
  const move = F.chess.moves({ square: F.selected, verbose: true })
    .find(m => m.to === sq);
  if (move) {
    const cap = move.flags.includes('c') || move.flags.includes('e');
    const chk = move.san.includes('+') || move.san.includes('#');
    if (cap || chk) F.found.add(move.from + move.to);
    F.selected = null;
    renderForcing();
    if (F.found.size >= F.total) endForcing();
  } else {
    const p = F.chess.get(sq);
    F.selected = (p && p.color === F.chess.turn()) ? sq : null;
    renderForcing();
  }
}

function startForcing() {
  const F = S.forcing;
  F.running = true;
  F.ended = false;
  document.getElementById('forcing-start').disabled = true;
  document.getElementById('forcing-done').disabled = false;
  if (F.timerId) clearInterval(F.timerId);
  F.timerId = setInterval(() => {
    F.timeLeft--;
    document.getElementById('forcing-time').textContent =
      formatTime(Math.max(0, F.timeLeft));
    if (F.timeLeft <= 0) endForcing();
  }, 1000);
}

function endForcing() {
  const F = S.forcing;
  if (!F.running && F.ended) return;
  F.running = false;
  F.ended = true;
  if (F.timerId) { clearInterval(F.timerId); F.timerId = null; }
  document.getElementById('forcing-done').disabled = true;
  document.getElementById('forcing-start').disabled = true;
  document.getElementById('forcing-next').disabled = false;
  document.getElementById('forcing-total').textContent = F.total;
  const all = computeForcingMoves(F.chess);
  const highlights = {};
  let missed = 0;
  for (const m of all) {
    if (F.found.has(m.from + m.to)) highlights[m.to] = 'found';
    else { highlights[m.to] = 'miss'; missed++; }
  }
  renderBoard(document.getElementById('forcing-board'), F.chess,
    { selected: null, highlights, onSquare: () => {} });
  const el = document.getElementById('forcing-result');
  el.style.display = 'block';
  el.innerHTML = `
    <p><strong>Hasil:</strong> ${F.found.size} dari ${F.total} forcing moves.</p>
    <p><strong>Terlewat:</strong> ${missed}</p>
    <p class="note">Hijau = ditemukan, merah = terlewat. Klik "Berikutnya" untuk posisi lain.</p>`;
}

document.getElementById('forcing-start').addEventListener('click', startForcing);
document.getElementById('forcing-done').addEventListener('click', endForcing);
document.getElementById('forcing-next').addEventListener('click', () => {
  S.forcing.idx++; initForcing();
});

// --- CHAOS ---
function initChaos() {
  const C = S.chaos;
  const pos = CHAOS_POSITIONS[C.idx % CHAOS_POSITIONS.length];
  C.chess = new Chess(pos.fen);
  C.picks = [];
  C.selected = null;
  C.revealed = false;
  document.getElementById('chaos-picks').textContent = '0/3';
  document.getElementById('chaos-list').innerHTML = '';
  document.getElementById('chaos-reveal').disabled = true;
  document.getElementById('chaos-result').style.display = 'none';
  renderChaos();
}

function renderChaos() {
  const C = S.chaos;
  if (!C.chess) return;
  const highlights = {};
  for (const p of C.picks) highlights[p.to] = 'pick';
  renderBoard(document.getElementById('chaos-board'), C.chess,
    { selected: C.selected, highlights, onSquare: onChaosSquare });
  document.getElementById('chaos-picks').textContent = C.picks.length + '/3';
  document.getElementById('chaos-reveal').disabled =
    C.picks.length !== 3 || C.revealed;
  const list = document.getElementById('chaos-list');
  list.innerHTML = '';
  for (const p of C.picks) {
    const li = document.createElement('li');
    li.textContent = p.san;
    list.appendChild(li);
  }
}

function onChaosSquare(sq) {
  const C = S.chaos;
  if (C.revealed) return;
  if (!C.selected) {
    const p = C.chess.get(sq);
    if (p && p.color === C.chess.turn()) { C.selected = sq; renderChaos(); }
    return;
  }
  if (sq === C.selected) { C.selected = null; renderChaos(); return; }
  const move = C.chess.moves({ square: C.selected, verbose: true })
    .find(m => m.to === sq);
  if (move) {
    if (C.picks.length < 3 &&
        !C.picks.some(p => p.from === move.from && p.to === move.to)) {
      C.picks.push({ from: move.from, to: move.to, san: move.san });
    }
    C.selected = null;
    renderChaos();
  } else {
    const p = C.chess.get(sq);
    C.selected = (p && p.color === C.chess.turn()) ? sq : null;
    renderChaos();
  }
}

function revealChaos() {
  const C = S.chaos;
  const pos = CHAOS_POSITIONS[C.idx % CHAOS_POSITIONS.length];
  C.revealed = true;
  const refSans = pos.sharp.map(s => s.san);
  const userSans = C.picks.map(p => p.san);
  const matches = userSans.filter(s => refSans.includes(s)).length;

  document.getElementById('chaos-reveal').disabled = true;
  const el = document.getElementById('chaos-result');
  el.style.display = 'block';
  el.innerHTML = `
    <p><strong>Pilihanmu:</strong> ${userSans.join(', ') || '-'}</p>
    <p><strong>Langkah tajam referensi:</strong></p>
    <ul style="margin:4px 0 8px 16px; padding:0;">
      ${pos.sharp.map(s => `<li><code>${s.san}</code> — ${s.note}</li>`).join('')}
    </ul>
    <p><strong>Skor:</strong> ${matches} / ${pos.sharp.length} referensi cocok.</p>
    <p class="note">Referensi ini pilihan editor, bukan kebenaran mutlak. Verifikasi dengan engine.</p>`;

  const highlights = {};
  for (const p of C.picks)
    highlights[p.to] = refSans.includes(p.san) ? 'found' : 'pick';
  const legalMoves = C.chess.moves({ verbose: true });
  for (const s of pos.sharp) {
    const m = legalMoves.find(mm => mm.san === s.san);
    if (m && !highlights[m.to]) highlights[m.to] = 'miss';
  }
  renderBoard(document.getElementById('chaos-board'), C.chess,
    { selected: null, highlights, onSquare: () => {} });

  const list = document.getElementById('chaos-list');
  list.innerHTML = '';
  for (const p of C.picks) {
    const li = document.createElement('li');
    li.textContent = p.san;
    li.className = refSans.includes(p.san) ? 'match' : 'miss';
    list.appendChild(li);
  }
}

document.getElementById('chaos-reveal').addEventListener('click', revealChaos);
document.getElementById('chaos-next').addEventListener('click', () => {
  S.chaos.idx++; initChaos();
});

window.addEventListener('DOMContentLoaded', () => showView('home'));
