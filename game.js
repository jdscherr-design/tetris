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
const CLEAR_MS = 160;
const LINES_PER_LEVEL = 10;
const LINE_SCORES = [0, 100, 300, 500, 800];
const NEXT_COUNT = 4;
const BEST_KEY = 'tetris-best';

const PIECES = {
  I: { color: '#35d0e6', shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
  J: { color: '#4d7cff', shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
  L: { color: '#ff9a3d', shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] },
  O: { color: '#f5d33f', shape: [[1, 1], [1, 1]] },
  S: { color: '#4fd66a', shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
  T: { color: '#b061ff', shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
  Z: { color: '#f2525e', shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
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

const $ = (id) => document.getElementById(id);
const boardCtx = $('board').getContext('2d');
const holdCtx = $('hold').getContext('2d');
const nextCtx = $('next').getContext('2d');
const CELL = $('board').width / COLS;

let board, piece, bag, queue, heldType, holdUsed;
let score, lines, level;
let state = 'menu'; // menu | playing | paused | over
let clearing = null; // { rows, timer } while a line clear is flashing
let fallTimer, lockTimer, lockResets, lowestY;
let moveDir = 0;
let dasTimer = 0;
let softDropping = false;
const held = { left: false, right: false };
let best = loadBest();
let lastTime = 0;

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Storage can be blocked; the best score then lasts only for this visit.
  }
}

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
}

function spawnNext() {
  queue.push(drawFromBag());
  spawn(queue.shift());
}

function newGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  bag = [];
  queue = Array.from({ length: NEXT_COUNT }, drawFromBag);
  heldType = null;
  score = 0;
  lines = 0;
  level = 1;
  clearing = null;
  moveDir = held.right ? 1 : held.left ? -1 : 0;
  softDropping = false;
  state = 'playing';
  spawnNext();
  updateOverlay();
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
  if (piece.type === 'O') return;
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
  lockPiece();
}

function hold() {
  if (holdUsed) return;
  const previous = heldType;
  heldType = piece.type;
  if (previous) spawn(previous);
  else spawnNext();
  holdUsed = true;
  renderSidePanels();
}

function lockPiece() {
  let aboveTop = true;
  piece.shape.forEach((row, y) => row.forEach((filled, x) => {
    if (!filled) return;
    const by = piece.y + y;
    if (by >= HIDDEN_ROWS) aboveTop = false;
    if (by >= 0) board[by][piece.x + x] = PIECES[piece.type].color;
  }));
  piece = null;
  if (aboveTop) {
    gameOver();
    return;
  }
  const full = [];
  board.forEach((row, y) => {
    if (row.every(Boolean)) full.push(y);
  });
  if (full.length > 0) {
    score += LINE_SCORES[full.length] * level;
    lines += full.length;
    level = Math.floor(lines / LINES_PER_LEVEL) + 1;
    clearing = { rows: full, timer: CLEAR_MS };
  } else {
    spawnNext();
  }
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
}

function gameOver() {
  state = 'over';
  piece = null;
  if (score > best) {
    best = score;
    saveBest();
  }
  updateHud();
  updateOverlay();
}

function setPaused(paused) {
  if (paused && state === 'playing') state = 'paused';
  else if (!paused && state === 'paused') state = 'playing';
  else return;
  releaseAll();
  updateOverlay();
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

function drawBlock(ctx, x, y, size, color) {
  const inset = size * 0.04;
  const s = size - inset * 2;
  ctx.fillStyle = color;
  ctx.fillRect(x + inset, y + inset, s, s);
  ctx.fillStyle = 'rgba(255, 255, 255, .28)';
  ctx.fillRect(x + inset, y + inset, s, size * 0.1);
  ctx.fillStyle = 'rgba(0, 0, 0, .22)';
  ctx.fillRect(x + inset, y + inset + s - size * 0.1, s, size * 0.1);
}

function render() {
  const ctx = boardCtx;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, .05)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, ctx.canvas.height);
  }
  for (let y = 1; y < VISIBLE_ROWS; y++) {
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(ctx.canvas.width, y * CELL);
  }
  ctx.stroke();

  if (!board) return;

  for (let y = HIDDEN_ROWS; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!board[y][x]) continue;
      const flashing = clearing && clearing.rows.includes(y);
      drawBlock(ctx, x * CELL, (y - HIDDEN_ROWS) * CELL, CELL, flashing ? '#ffffff' : board[y][x]);
    }
  }

  if (!piece) return;

  let ghostY = piece.y;
  while (!collides(piece.shape, piece.x, ghostY + 1)) ghostY++;
  const color = PIECES[piece.type].color;

  piece.shape.forEach((row, y) => row.forEach((filled, x) => {
    if (!filled) return;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 3;
    ctx.strokeRect((piece.x + x) * CELL + 5, (ghostY + y - HIDDEN_ROWS) * CELL + 5, CELL - 10, CELL - 10);
    ctx.globalAlpha = 1;
  }));

  piece.shape.forEach((row, y) => row.forEach((filled, x) => {
    if (filled) drawBlock(ctx, (piece.x + x) * CELL, (piece.y + y - HIDDEN_ROWS) * CELL, CELL, color);
  }));
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
  for (const [x, y] of filled) drawBlock(ctx, ox + x * size, oy + y * size, size, PIECES[type].color);
}

function renderSidePanels() {
  holdCtx.clearRect(0, 0, holdCtx.canvas.width, holdCtx.canvas.height);
  holdCtx.globalAlpha = holdUsed ? 0.4 : 1;
  drawPreview(holdCtx, heldType, 0, holdCtx.canvas.height);
  holdCtx.globalAlpha = 1;

  nextCtx.clearRect(0, 0, nextCtx.canvas.width, nextCtx.canvas.height);
  const slot = nextCtx.canvas.height / NEXT_COUNT;
  queue.forEach((type, i) => drawPreview(nextCtx, type, i * slot, slot));
}

function updateHud() {
  $('score').textContent = score.toLocaleString();
  $('best').textContent = Math.max(best, score).toLocaleString();
  $('level').textContent = level;
  $('lines').textContent = lines;
}

function updateOverlay() {
  const overlay = $('overlay');
  overlay.hidden = state === 'playing';
  $('pause').textContent = state === 'paused' ? 'Resume' : 'Pause';
  if (state === 'paused') {
    $('overlay-title').textContent = 'Paused';
    $('overlay-text').textContent = '';
    $('overlay-button').textContent = 'Resume';
  } else if (state === 'over') {
    $('overlay-title').textContent = 'Game over';
    $('overlay-text').textContent = `Score ${score.toLocaleString()}\nBest ${best.toLocaleString()}`;
    $('overlay-button').textContent = 'Play again';
  }
}

function overlayAction() {
  if (state === 'paused') setPaused(false);
  else newGame();
  $('overlay-button').blur();
}

// Input: keyboard and touch both go through press/release.
function press(action) {
  if (state !== 'playing') return;
  if (action === 'left' || action === 'right') {
    held[action] = true;
    moveDir = action === 'left' ? -1 : 1;
    dasTimer = DAS_MS;
    if (piece && !clearing) move(moveDir);
    return;
  }
  if (action === 'down') {
    softDropping = true;
    fallTimer = Math.max(fallTimer, SOFT_DROP_MS);
    return;
  }
  if (!piece || clearing) return;
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
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    if (!e.repeat) setPaused(state === 'playing');
    return;
  }
  if (e.code === 'Enter' && state !== 'playing') {
    e.preventDefault();
    if (!e.repeat) overlayAction();
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

$('overlay-button').addEventListener('click', overlayAction);
$('pause').addEventListener('click', () => {
  setPaused(state === 'playing');
  $('pause').blur();
});

window.addEventListener('blur', () => setPaused(true));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) setPaused(true);
});

function frame(time) {
  // Clamp so a stalled tab can't fast-forward the game.
  const dt = Math.min(time - lastTime, 100);
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

score = 0;
lines = 0;
level = 1;
queue = [];
heldType = null;
updateHud();
requestAnimationFrame((time) => {
  lastTime = time;
  frame(time);
});
