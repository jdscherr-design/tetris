'use strict';

const COLS = 10;
const VISIBLE_ROWS = 20;
const HIDDEN_ROWS = 2;
const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

const DAS_MS = 150;
const ARR_MS = 40;
const SOFT_DROP_MS = 40;
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
const CLEAR_MS = [0, 220, 260, 320, 400];
const LINES_PER_LEVEL = 10;
const LINE_SCORES = [0, 100, 300, 500, 800];
const COMBO_SCORE = 50;
const BACK_TO_BACK = 1.5;
const NEXT_COUNT = 4;
const MAX_SCORES = 5;

const PIECES = {
  I: { name: 'The Sigma', color: '#12b8ff', shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  J: { name: 'Fanum', color: '#4b63ff', shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  L: { name: 'Skibidi', color: '#ff7a18', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
  O: { name: 'Ohio', color: '#ffe600', shape: [[1, 1], [1, 1]] },
  S: { name: 'Sus', color: '#9dff00', shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  T: { name: 'The Rizzler', color: '#a93cff', shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  Z: { name: 'NPC', color: '#ff2a9d', shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
};

// SRS wall kicks, keyed by "from>to", as [x, y] with y pointing down the board.
const KICKS = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const I_KICKS = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be blocked; settings and scores then last only for this visit.
    }
  },
};

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const settings = Object.assign({ mode: 'normal', volume: 0.6, muted: false, reduced: prefersReduced }, Store.get('brainrot-settings', {}));
if (!MODES[settings.mode]) settings.mode = 'normal';

function loadScores() {
  const saved = Store.get('brainrot-scores', null);
  if (Array.isArray(saved)) return saved.filter((s) => s && Number.isFinite(s.score));
  // Keep the best score from before the game was renamed.
  const oldBest = Store.get('tetris-best', 0);
  return Number(oldBest) > 0 ? [{ score: Number(oldBest), lines: 0, rank: 'Pre-brainrot legend', mode: 'normal' }] : [];
}

const $ = (id) => document.getElementById(id);
const boardCtx = $('board').getContext('2d');
const holdCtx = $('hold').getContext('2d');
const nextCtx = $('next').getContext('2d');
const CELL = $('board').width / COLS;

let board, piece, bag, queue, heldType, holdUsed;
let score = 0;
let lines = 0;
let level = 1;
let state = 'menu'; // menu | playing | paused | over
let clearing = null; // { rows, timer, duration } while a line clear is animating
let fallTimer, lockTimer, lockResets, lowestY;
let moveDir = 0;
let dasTimer = 0;
let softDropping = false;
let bufferedAction = null;
let combo = -1;
let lastClearWasTetris = false;
let displayX = 0;
let stats = null;
let shownScore = -1;
let lastRun = null;
const held = { left: false, right: false };
const scores = loadScores();
let best = scores.length ? scores[0].score : 0;
let lastTime = 0;

// Sprites: each piece's identity is a face painted on its blocks.
function drawFace(g, type) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const ink = '#12031f';
  const eye = (x, y, r = 8) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  };
  const dot = (x, y, r = 3.5) => {
    g.fillStyle = ink;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  };
  const line = (...pts) => {
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  if (type === 'I') {
    // Sigma: sunglasses, no emotion
    g.fillStyle = ink;
    g.fillRect(10, 20, 40, 5);
    g.fillRect(12, 22, 16, 11);
    g.fillRect(32, 22, 16, 11);
    line([22, 44], [40, 42]);
  } else if (type === 'O') {
    // Ohio: dizzy eyes, wavy mouth
    line([14, 18], [26, 30]);
    line([26, 18], [14, 30]);
    line([34, 18], [46, 30]);
    line([46, 18], [34, 30]);
    line([14, 44], [22, 39], [30, 45], [38, 39], [46, 44]);
  } else if (type === 'T') {
    // Rizzler: wink and a smirk
    eye(21, 25);
    dot(22, 26);
    line([33, 26], [40, 22], [47, 26]);
    line([20, 41], [34, 45], [44, 37]);
  } else if (type === 'S') {
    // Sus: side-eye
    eye(20, 25);
    eye(40, 25);
    dot(25, 25, 4);
    dot(45, 25, 4);
    line([24, 44], [38, 41]);
  } else if (type === 'Z') {
    // NPC: nothing behind the eyes
    dot(21, 26, 4);
    dot(39, 26, 4);
    line([20, 42], [40, 42]);
  } else if (type === 'J') {
    // Fanum: permanently eating
    dot(21, 19, 4);
    dot(39, 19, 4);
    g.fillStyle = ink;
    g.beginPath();
    g.ellipse(30, 38, 15, 12, 0, 0, 7);
    g.fill();
    g.fillStyle = '#fff';
    g.fillRect(22, 28, 6, 6);
    g.fillRect(32, 28, 6, 6);
  } else if (type === 'L') {
    // Skibidi: mismatched eyes, tongue out
    eye(19, 23, 10);
    dot(20, 24, 4);
    eye(42, 26, 5);
    dot(42, 26, 2);
    line([18, 41], [42, 41]);
    g.fillStyle = '#ff2a9d';
    g.fillRect(28, 42, 9, 9);
  }
}

function makeSprite(type) {
  const c = document.createElement('canvas');
  c.width = c.height = 60;
  const g = c.getContext('2d');
  const color = PIECES[type].color;
  g.fillStyle = color;
  g.beginPath();
  g.roundRect(2, 2, 56, 56, 9);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, .3)';
  g.beginPath();
  g.roundRect(5, 5, 50, 8, 4);
  g.fill();
  g.fillStyle = 'rgba(0, 0, 0, .22)';
  g.beginPath();
  g.roundRect(5, 49, 50, 6, 3);
  g.fill();
  drawFace(g, type);
  return c;
}

const SPRITES = Object.fromEntries(Object.keys(PIECES).map((type) => [type, makeSprite(type)]));

function rotateMatrix(shape, dir) {
  const n = shape.length;
  const out = shape.map((row) => row.slice());
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (dir > 0) out[x][n - 1 - y] = shape[y][x];
      else out[n - 1 - x][y] = shape[y][x];
    }
  }
  return out;
}

function collides(shape, px, py) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const bx = px + x;
      const by = py + y;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
  }
  return false;
}

function drawFromBag() {
  if (bag.length === 0) {
    bag = Object.keys(PIECES);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return bag.pop();
}

function spawn(type) {
  const shape = PIECES[type].shape;
  piece = { type, shape, rotation: 0, x: Math.floor((COLS - shape.length) / 2), y: 0 };
  displayX = piece.x;
  fallTimer = 0;
  lockTimer = 0;
  lockResets = 0;
  lowestY = 0;
  holdUsed = false;
  if (collides(piece.shape, piece.x, piece.y)) {
    gameOver();
    return;
  }
  // Pieces appear just above the visible rows, then drop straight into view when there's room.
  if (!collides(piece.shape, piece.x, piece.y + 1)) piece.y++;
  lowestY = piece.y;
  Rot.onSpawn(type);
}

function spawnNext() {
  queue.push(drawFromBag());
  spawn(queue.shift());
}

function newGame(isRetry = false) {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  bag = [];
  queue = Array.from({ length: NEXT_COUNT }, drawFromBag);
  heldType = null;
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  lastClearWasTetris = false;
  clearing = null;
  bufferedAction = null;
  moveDir = held.right ? 1 : held.left ? -1 : 0;
  softDropping = false;
  stats = { pieces: 0, bad: 0, holes: 0, tetrises: 0, maxCombo: 0, taxes: 0 };
  state = 'playing';
  Rot.onStart(isRetry);
  spawnNext();
  showView(null);
  updateHud();
  renderSidePanels();
}

function gravityMs() {
  // Guideline speed curve; flattens out at level 20.
  const l = Math.min(level, 20) - 1;
  return Math.pow(0.8 - l * 0.007, l) * 1000;
}

function isGrounded() {
  return collides(piece.shape, piece.x, piece.y + 1);
}

function noteMoved() {
  if (lockTimer > 0 && lockResets < MAX_LOCK_RESETS) {
    lockTimer = 0;
    lockResets++;
  }
}

function move(dx) {
  if (collides(piece.shape, piece.x + dx, piece.y)) return false;
  piece.x += dx;
  noteMoved();
  return true;
}

function rotate(dir) {
  if (piece.type === 'O') {
    Rot.onSquareSpin();
    return;
  }
  const to = (piece.rotation + dir + 4) % 4;
  const shape = rotateMatrix(piece.shape, dir);
  const table = piece.type === 'I' ? I_KICKS : KICKS;
  for (const [kx, ky] of table[`${piece.rotation}>${to}`]) {
    if (!collides(shape, piece.x + kx, piece.y + ky)) {
      piece.shape = shape;
      piece.rotation = to;
      piece.x += kx;
      piece.y += ky;
      noteMoved();
      Rot.onRotate();
      return;
    }
  }
}

function stepDown() {
  if (isGrounded()) return false;
  piece.y++;
  if (piece.y > lowestY) {
    lowestY = piece.y;
    lockTimer = 0;
    lockResets = 0;
  }
  return true;
}

function hardDrop() {
  let cells = 0;
  while (stepDown()) cells++;
  score += cells * 2;
  Rot.onHardDrop(cells);
  lockPiece(cells);
}

function hold() {
  if (holdUsed) {
    Rot.onHold(false);
    return;
  }
  const previous = heldType;
  heldType = piece.type;
  Rot.onHold(true);
  if (previous) spawn(previous);
  else spawnNext();
  holdUsed = true;
  renderSidePanels();
}

function countHoles(rows) {
  let holes = 0;
  for (let x = 0; x < COLS; x++) {
    let covered = false;
    for (let y = 0; y < rows.length; y++) {
      if (rows[y][x]) covered = true;
      else if (covered) holes++;
    }
  }
  return holes;
}

function stackHeight(rows) {
  const top = rows.findIndex((row) => row.some(Boolean));
  return top === -1 ? 0 : rows.length - top;
}

function lockPiece(hardCells = 0) {
  const { type, rotation } = piece;
  const holesBefore = countHoles(board);
  const heightBefore = stackHeight(board);
  let aboveTop = true;
  piece.shape.forEach((row, y) => row.forEach((filled, x) => {
    if (!filled) return;
    const by = piece.y + y;
    if (by >= HIDDEN_ROWS) aboveTop = false;
    if (by >= 0) board[by][piece.x + x] = type;
  }));
  piece = null;
  stats.pieces++;
  if (aboveTop) {
    gameOver();
    return;
  }

  const full = [];
  board.forEach((row, y) => {
    if (row.every(Boolean)) full.push(y);
  });
  const settled = board.filter((_, y) => !full.includes(y));
  while (settled.length < ROWS) settled.unshift(Array(COLS).fill(null));
  const holesAdded = countHoles(settled) - holesBefore;
  const height = stackHeight(settled);

  const scoreBefore = score;
  const bestBefore = best;
  const previousLevel = level;
  const isTetris = full.length === 4;
  const backToBack = isTetris && lastClearWasTetris;
  if (full.length > 0) {
    let earned = LINE_SCORES[full.length] * level;
    if (backToBack) earned = Math.floor(earned * BACK_TO_BACK);
    combo++;
    earned += COMBO_SCORE * combo * level;
    score += earned;
    lines += full.length;
    level = Math.floor(lines / LINES_PER_LEVEL) + 1;
    lastClearWasTetris = isTetris;
    if (isTetris) stats.tetrises++;
    stats.maxCombo = Math.max(stats.maxCombo, combo);
    clearing = { rows: full, timer: CLEAR_MS[full.length], duration: CLEAR_MS[full.length] };
  } else {
    combo = -1;
  }

  const bad = full.length === 0 && (holesAdded >= 2 || (holesAdded >= 1 && height - heightBefore >= 3));
  if (bad) stats.bad++;
  if (holesAdded > 0) stats.holes += holesAdded;

  Rot.onLock({
    type,
    bad,
    holesAdded,
    height,
    hardCells,
    previousLevel,
    bestBefore,
    level,
    backToBack,
    rows: full,
    lines: full.length,
    gained: score - scoreBefore,
    combo: full.length ? combo : -1,
    allClear: full.length > 0 && height === 0,
    wastedSigma: type === 'I' && full.length === 0 && rotation % 2 === 0,
  });

  if (full.length === 0) spawnNext();
  updateHud();
  renderSidePanels();
}

function finishClear() {
  for (const y of clearing.rows) {
    board.splice(y, 1);
    board.unshift(Array(COLS).fill(null));
  }
  clearing = null;
  spawnNext();
  renderSidePanels();
  if (bufferedAction && piece) {
    const action = bufferedAction;
    bufferedAction = null;
    press(action);
  }
  bufferedAction = null;
}

function recordScore() {
  if (score <= 0) return null;
  const report = Rot.report(lastRun);
  const entry = { score, lines, rank: report.rank, mode: settings.mode, at: Date.now() };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.length = Math.min(scores.length, MAX_SCORES);
  Store.set('brainrot-scores', scores);
  return scores.includes(entry) ? entry : null;
}

function gameOver() {
  state = 'over';
  piece = null;
  clearing = null;
  releaseAll();
  lastRun = { score, lines, level, pieces: stats.pieces, bad: stats.bad, holes: stats.holes, tetrises: stats.tetrises, maxCombo: stats.maxCombo, taxes: stats.taxes };
  const entry = recordScore();
  best = Math.max(best, score);
  Rot.onGameOver();
  updateHud();
  renderReport();
  renderScores(entry);
  showView('over');
}

function setPaused(paused) {
  if (paused && state === 'playing') {
    state = 'paused';
    releaseAll();
    Rot.onPause();
    showView('pause');
  } else if (!paused && state === 'paused') {
    state = 'playing';
    Rot.onResume();
    showView(null);
  }
}

function goToMenu() {
  state = 'menu';
  board = null;
  piece = null;
  clearing = null;
  score = 0;
  lines = 0;
  level = 1;
  queue = [];
  heldType = null;
  holdUsed = false;
  releaseAll();
  Rot.onQuit();
  updateHud();
  renderSidePanels();
  renderScores(null);
  showView('menu');
}

function releaseAll() {
  held.left = held.right = false;
  moveDir = 0;
  softDropping = false;
  document.querySelectorAll('.touch .active').forEach((b) => b.classList.remove('active'));
}

function update(dt) {
  if (state !== 'playing') return;
  if (clearing) {
    clearing.timer -= dt;
    if (clearing.timer <= 0) finishClear();
    return;
  }
  if (!piece) return;

  if (moveDir !== 0) {
    dasTimer -= dt;
    while (dasTimer <= 0) {
      if (!move(moveDir)) {
        dasTimer = 0;
        break;
      }
      dasTimer += ARR_MS;
    }
  }

  const interval = softDropping ? Math.min(SOFT_DROP_MS, gravityMs()) : gravityMs();
  fallTimer += dt;
  while (fallTimer >= interval) {
    fallTimer -= interval;
    if (!stepDown()) {
      fallTimer = 0;
      break;
    }
    if (softDropping) score += 1;
  }

  if (isGrounded()) {
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY_MS) lockPiece();
  } else {
    lockTimer = 0;
  }
  updateHud();
}

function drawCell(ctx, type, x, y, size) {
  ctx.drawImage(SPRITES[type], x, y, size, size);
}

function render(dt = 0) {
  const ctx = boardCtx;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(169, 60, 255, .16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, H);
  }
  for (let y = 1; y < VISIBLE_ROWS; y++) {
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W, y * CELL);
  }
  ctx.stroke();

  Rot.drawBehind(ctx, dt);

  if (!board) return;

  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    const flashing = clearing && clearing.rows.includes(y);
    for (let x = 0; x < COLS; x++) {
      if (!board[y][x]) continue;
      const px = x * CELL;
      const py = (y - HIDDEN_ROWS) * CELL;
      if (flashing) {
        // Cleared rows vanish from the middle outward.
        const p = 1 - clearing.timer / clearing.duration;
        const delay = (1 - Math.abs(x - 4.5) / 4.5) * 0.5;
        const scale = settings.reduced ? 1 : Math.max(0, 1 - Math.max(0, p - delay) * 2);
        const size = CELL * scale;
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + (CELL - size) / 2, py + (CELL - size) / 2, size, size);
      } else {
        drawCell(ctx, board[y][x], px, py, CELL);
      }
    }
  }

  if (piece) {
    let ghostY = piece.y;
    while (!collides(piece.shape, piece.x, ghostY + 1)) ghostY++;
    const color = PIECES[piece.type].color;

    // The visual position glides between cells; the real position stays on the grid.
    const interval = gravityMs();
    const glide = !settings.reduced && !softDropping && interval > 120 && !isGrounded() ? Math.min(1, fallTimer / interval) : 0;
    const ease = settings.reduced ? 1 : Math.min(1, dt / 35);
    displayX += (piece.x - displayX) * ease;
    if (Math.abs(displayX - piece.x) < 0.01) displayX = piece.x;

    piece.shape.forEach((row, y) => row.forEach((filled, x) => {
      if (!filled) return;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 4;
      ctx.strokeRect((piece.x + x) * CELL + 5, (ghostY + y - HIDDEN_ROWS) * CELL + 5, CELL - 10, CELL - 10);
      ctx.globalAlpha = 1;
    }));

    piece.shape.forEach((row, y) => row.forEach((filled, x) => {
      if (filled) drawCell(ctx, piece.type, (displayX + x) * CELL, (piece.y + glide + y - HIDDEN_ROWS) * CELL, CELL);
    }));
  }

  Rot.drawFront(ctx, dt);
}

function drawPreview(ctx, type, slotY, slotH) {
  if (!type) return;
  const shape = PIECES[type].shape;
  const size = ctx.canvas.width / 5;
  const filled = [];
  shape.forEach((row, y) => row.forEach((v, x) => {
    if (v) filled.push([x, y]);
  }));
  const xs = filled.map((c) => c[0]);
  const ys = filled.map((c) => c[1]);
  const width = Math.max(...xs) - Math.min(...xs) + 1;
  const height = Math.max(...ys) - Math.min(...ys) + 1;
  const ox = (ctx.canvas.width - width * size) / 2 - Math.min(...xs) * size;
  const oy = slotY + (slotH - height * size) / 2 - Math.min(...ys) * size;
  for (const [x, y] of filled) drawCell(ctx, type, ox + x * size, oy + y * size, size);
}

function renderSidePanels() {
  holdCtx.clearRect(0, 0, holdCtx.canvas.width, holdCtx.canvas.height);
  holdCtx.globalAlpha = holdUsed ? 0.4 : 1;
  drawPreview(holdCtx, heldType, 0, holdCtx.canvas.height);
  holdCtx.globalAlpha = 1;
  $('hold-name').textContent = heldType ? PIECES[heldType].name : ' ';

  nextCtx.clearRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
  const slot = nextCtx.canvas.height / NEXT_COUNT;
  queue.forEach((type, i) => drawPreview(nextCtx, type, i * slot, slot));
  $('next-name').textContent = queue.length ? PIECES[queue[0]].name : ' ';
}

function updateHud() {
  if (score !== shownScore) {
    const el = $('score');
    if (score - shownScore >= 100 && !settings.reduced) {
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    el.textContent = score.toLocaleString();
    shownScore = score;
  }
  $('best').textContent = Math.max(best, score).toLocaleString();
  $('level').textContent = level;
  $('lines').textContent = lines;
}

function showView(view) {
  $('overlay').hidden = view === null;
  $('view-menu').hidden = view !== 'menu';
  $('view-pause').hidden = view !== 'pause';
  $('view-over').hidden = view !== 'over';
  $('settings').hidden = view === 'over';
  $('scores-box').hidden = view === 'pause';
  $('pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
  const focus = { menu: 'play', pause: 'resume' }[view];
  if (focus) $(focus).focus({ preventScroll: true });
  if (view === 'over') armRetry();
  if (view) $('overlay').scrollTop = 0;
}

// Someone mashing drop as they die shouldn't skip the report, so Retry waits a moment.
function armRetry() {
  const retry = $('retry');
  retry.disabled = true;
  setTimeout(() => {
    retry.disabled = false;
    if (state === 'over') retry.focus({ preventScroll: true });
  }, 900);
}

function renderReport() {
  const report = Rot.report(lastRun);
  $('rank').textContent = report.rank;
  $('prognosis').textContent = report.prognosis;
  $('share-status').textContent = '';
  const list = $('report');
  list.textContent = '';
  report.rows.forEach(([label, value], i) => {
    const row = document.createElement('div');
    row.style.setProperty('--i', i);
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.append(dt, dd);
    list.append(row);
  });
}

function renderScores(highlight) {
  const list = $('scores');
  list.textContent = '';
  for (const entry of scores) {
    const row = document.createElement('li');
    if (entry === highlight) row.className = 'me';
    const value = document.createElement('b');
    value.textContent = entry.score.toLocaleString();
    const rank = document.createElement('span');
    rank.textContent = entry.rank || '';
    row.append(value, rank);
    list.append(row);
  }
}

async function shareScore() {
  const report = Rot.report(lastRun);
  const url = location.href.split(/[?#]/)[0];
  const text = `I earned ${lastRun.score.toLocaleString()} AURA in Brainrot Tetris. Official rank: ${report.rank}. NPC probability: ${report.npc.toFixed(1)}%. Diagnosis: Chronically Online.`;
  const status = $('share-status');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Brainrot Tetris', text, url });
      status.textContent = 'Shared. The damage is done.';
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      status.textContent = 'Copied. Paste it somewhere regrettable.';
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
    status.textContent = `${text} ${url}`;
  }
}

// Input: keyboard and touch both go through press/release.
function press(action) {
  if (state !== 'playing') return;
  Rot.onInput();
  if (action === 'left' || action === 'right') {
    held[action] = true;
    moveDir = action === 'left' ? -1 : 1;
    dasTimer = DAS_MS;
    if (piece && !clearing && move(moveDir)) Sfx.move();
    return;
  }
  if (action === 'down') {
    softDropping = true;
    fallTimer = Math.max(fallTimer, SOFT_DROP_MS);
    return;
  }
  if (clearing) {
    // Remember one input during the short clear animation, so fast play never feels dropped.
    bufferedAction = action;
    return;
  }
  if (!piece) return;
  if (action === 'cw') rotate(1);
  else if (action === 'ccw') rotate(-1);
  else if (action === 'hard') hardDrop();
  else if (action === 'hold') hold();
}

function release(action) {
  if (action === 'left' || action === 'right') {
    held[action] = false;
    const stillHeld = held.left ? -1 : held.right ? 1 : 0;
    if (moveDir !== stillHeld) {
      moveDir = stillHeld;
      dasTimer = DAS_MS;
    }
  } else if (action === 'down') {
    softDropping = false;
  }
}

const KEY_ACTIONS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'down',
  ArrowUp: 'cw',
  KeyX: 'cw',
  KeyZ: 'ccw',
  Space: 'hard',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
};

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'KeyM' && !e.repeat) {
    setMuted(!settings.muted);
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (!e.repeat) setPaused(state === 'playing');
    return;
  }
  if (state !== 'playing') {
    // Menus keep normal keyboard behaviour, so Space and arrows work on their controls.
    if (e.code === 'KeyR' && !e.repeat && (state === 'paused' || state === 'over')) newGame(true);
    return;
  }
  const action = KEY_ACTIONS[e.code];
  if (!action) return;
  e.preventDefault();
  if (!e.repeat) press(action);
});

document.addEventListener('keyup', (e) => {
  const action = KEY_ACTIONS[e.code];
  if (action) release(action);
});

document.querySelectorAll('.touch button').forEach((button) => {
  const { action } = button.dataset;
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    button.classList.add('active');
    button.setPointerCapture(e.pointerId);
    press(action);
  });
  const end = () => {
    button.classList.remove('active');
    release(action);
  };
  button.addEventListener('pointerup', end);
  button.addEventListener('pointercancel', end);
  button.addEventListener('contextmenu', (e) => e.preventDefault());
});

// Settings
function saveSettings() {
  Store.set('brainrot-settings', settings);
}

function setMuted(muted) {
  settings.muted = muted;
  Sfx.setMuted(muted);
  $('mute').textContent = muted ? '🔇 Muted' : '🔊 Sound';
  $('mute').setAttribute('aria-pressed', String(muted));
  $('mute-check').checked = muted;
  saveSettings();
}

function setMode(mode) {
  settings.mode = mode;
  document.body.classList.toggle('mode-online', mode === 'online');
  document.body.classList.toggle('mode-ohio', mode === 'ohio');
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  Rot.markBgDirty();
  saveSettings();
}

function setReduced(reduced) {
  settings.reduced = reduced;
  document.body.classList.toggle('reduced', reduced);
  $('reduced').checked = reduced;
  Rot.markBgDirty();
  saveSettings();
}

document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener('change', () => {
    setMode(input.value);
    Sfx.click();
  });
});

$('volume').addEventListener('input', (e) => {
  settings.volume = Number(e.target.value) / 100;
  Sfx.setVolume(settings.volume);
  if (settings.muted && settings.volume > 0) setMuted(false);
  saveSettings();
});
$('volume').addEventListener('change', () => Sfx.click());
$('mute-check').addEventListener('change', (e) => setMuted(e.target.checked));
$('reduced').addEventListener('change', (e) => setReduced(e.target.checked));

$('mute').addEventListener('click', () => {
  setMuted(!settings.muted);
  $('mute').blur();
});
$('pause').addEventListener('click', () => {
  setPaused(state === 'playing');
  $('pause').blur();
});
$('play').addEventListener('click', () => newGame(false));
$('resume').addEventListener('click', () => setPaused(false));
$('restart').addEventListener('click', () => newGame(true));
$('quit').addEventListener('click', goToMenu);
$('retry').addEventListener('click', () => newGame(true));
$('quit-over').addEventListener('click', goToMenu);
$('share').addEventListener('click', shareScore);

// Browsers only let audio start after a real click, tap or key press.
document.addEventListener('pointerdown', Sfx.unlock, true);
document.addEventListener('keydown', Sfx.unlock, true);

window.addEventListener('blur', () => setPaused(true));
window.addEventListener('resize', Rot.resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

function frame(time) {
  // Clamp so a stalled tab can't fast-forward the game.
  const dt = Math.min(time - lastTime, 100);
  lastTime = time;
  update(dt);
  render(dt);
  Rot.tick(dt);
  requestAnimationFrame(frame);
}

$('volume').value = Math.round(settings.volume * 100);
Sfx.setVolume(settings.volume);
setMuted(settings.muted);
setMode(settings.mode);
setReduced(settings.reduced);
queue = [];
heldType = null;
updateHud();
renderScores(null);
showView('menu');
requestAnimationFrame((time) => {
  lastTime = time;
  frame(time);
});
