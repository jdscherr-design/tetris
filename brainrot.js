'use strict';

// Everything in this file is presentation. Nothing here changes the board, the pieces or the aura.
const MODES = {
  normal: { float: [7, 12], chat: [5, 9], ambient: [14, 22], warn: null, cameo: null, tax: 0.12, taxCooldown: 45, incident: [90, 140], shake: 1, emoji: 8 },
  online: { float: [3, 6], chat: [2, 4], ambient: [8, 14], warn: [45, 75], cameo: [40, 70], tax: 0.25, taxCooldown: 28, incident: [45, 80], shake: 1.25, emoji: 14 },
  ohio: { float: [1.2, 2.5], chat: [0.8, 2], ambient: [5, 9], warn: [12, 22], cameo: [16, 30], tax: 0.4, taxCooldown: 18, incident: [22, 40], shake: 1.5, emoji: 22 },
};

const LINES = {
  start: [
    'CHAT, IS THIS REAL?',
    "Bro thinks he's the main character.",
    'Your last brain cell has entered the chat.',
    "Hi. I'm your last brain cell. We need to talk.",
    'Seven shapes. Ten columns. Zero survivors.',
    'Stream is live. Four viewers. Three are bots. One is your mom.',
    "I've seen your search history. Let's see if you can stack.",
  ],
  retry: [
    "Back already? The blocks didn't even miss you.",
    'Run {n}. Insanity is a lifestyle now.',
    'That was fast. Most people grieve for longer.',
    'We do not learn from history here.',
    "Same brain cell, new mistakes. Let's go.",
  ],
  single: [
    'Bro did the bare minimum 💀',
    "+5 aura. Don't spend it all.",
    'NPC-level achievement.',
    'One line. Alert the press. Actually, don\'t.',
    'Congratulations on cleaning one (1) shelf.',
    "Chat, clip that. Actually no, don't.",
    'A single. Like you.',
    'Small steps. Medically small.',
  ],
  double: [
    'BRUH. Two lines? Okay, ambition.',
    'A double. Your rizz is now a rumor.',
    'Two whole lines. Somebody tell your parents.',
    'Aura slowly returning to the body.',
    'Mid, but in a way I respect.',
  ],
  triple: [
    'THREE LINES. One short of greatness. Story of your life.',
    'So close to cooking. Bro only preheated.',
    'A triple. Chat is typing…',
    'Respectable. I hate that.',
    'That was almost a personality.',
  ],
  tetris: [
    'LET HIM COOOOOOK 🔥',
    'MAXIMUM SKIBIDI RIZZ!',
    'BRO IS ACTUALLY HIM.',
    'ABSOLUTE CINEMA.',
    'FOUR LINES. THE ELDERS SPOKE OF THIS.',
    'I AM A SINGLE NEURON AND I AM WEEPING.',
    'SOMEONE CALL OHIO. TELL THEM WE WON.',
  ],
  backToBack: [
    'TWO IN A ROW?? GET THIS PERSON A TED TALK.',
    'BACK-TO-BACK. HR HAS BEEN NOTIFIED.',
    'THE BLOCKS ARE SCARED. I AM SCARED.',
  ],
  combo: [
    '{n} clears in a row. Bro has a routine now.',
    '{n} in a row. This is the most consistent thing you have ever done.',
    "{n} straight. Don't look down.",
  ],
  allClear: [
    'BOARD CLEAR. THE FLOOR EXISTS??',
    "I've never seen the bottom of this place. It's beautiful.",
  ],
  questionable: [
    'Bro is NOT cooking.',
    'Negative 10,000 aura.',
    "Even an NPC wouldn't do that.",
    'I watched that live and I still have questions.',
    'That placement was a cry for help.',
    'The block had a family.',
    'Bold. Wrong, but bold.',
  ],
  holes: [
    "That's {n} new holes. Bro is building cheese.",
    '{n} fresh holes. Nobody asked for a basement.',
    "{n} holes in one move. That's a golf score, not a plan.",
  ],
  yeet: [
    'No hesitation. No plan. Incredible.',
    'Bro fired that from orbit and missed the planet.',
    'Speed was never the problem here.',
  ],
  wastedSigma: [
    'You used THE SIGMA for that? A shelf?',
    'The Sigma trained for years. For this.',
    "That's a four-line piece. You made a coffee table.",
  ],
  clean: [
    'Clean placement. Suspicious.',
    "No holes. Who's controlling you?",
    "That was fine. Don't tell anyone I said so.",
    "Okay. Okay. I'm listening.",
  ],
  fixed: [
    'Okay, that fixed it. I retract 4% of what I said.',
    'Fine. The mess was part of the plan. Sure.',
    'Bro cleaned up his own crime scene.',
  ],
  danger: [
    'CHAT WE ARE COOKED.',
    'YOUR BRAIN CELLS ARE EVACUATING.',
    "IT'S GIVING SKILL ISSUE.",
    "I can see the ceiling from here. It's judging us.",
    "I'm packing. I'm one cell, so it's one bag.",
    'YOU BUILT A STAIRCASE TO YOUR OWN FUNERAL.',
  ],
  clutch: [
    'HOLD UP. BRO CAME BACK FROM OHIO.',
    'A recovery arc? In THIS economy?',
    "I unpacked. Don't make me regret this.",
    'Chat, delete the obituary. Keep the draft.',
  ],
  gameOver: [
    'YOU HAVE BEEN FANUM TAXED.',
    'FINAL BRAIN CELL ELIMINATED.',
    'BRO GOT SENT BACK TO OHIO.',
    'Uninstalling your aura…',
    'Tell my dendrites I loved them.',
  ],
  squareSpin: [
    "Bro rotated the square. It's a square.",
    "{n} rotations. Still a square. It's going to stay a square.",
    'Looking for the other side of a square, are we?',
    'The square would like you to stop.',
  ],
  overthink: [
    '{n} rotations. This is a block, not a Rubik\'s Cube.',
    "It's been {n} spins. The piece is getting dizzy.",
  ],
  holdSpam: [
    'Commitment issues detected.',
    "Put it back. No, take it out. Classic.",
    'Bro is window-shopping tetrominoes.',
  ],
  idle: [
    "Hello? Blink twice if you're touching grass.",
    'Bro went AFK mid-disaster.',
    "The block is waiting. We're all waiting.",
    'If you left, I respect it. Take me with you.',
  ],
  levelUp: [
    'Brainrot level {n}. The blocks have been told about you.',
    "Level {n}. Gravity's getting personal.",
    'Level {n}. Your doctor would like a word.',
    'Level {n}. I no longer recognize us.',
  ],
  peak: [
    'NEW PEAK AURA. Frame it. Your family won\'t.',
    'That\'s a personal best. Nobody at school will ever know.',
  ],
  pause: [
    "Go touch grass. I'll wait.",
    'Bro alt-tabbed mid-crisis.',
    "Paused. The blocks can't hurt you here. Yet.",
    'Take your time. Your aura is decaying anyway.',
  ],
  resume: [
    'The grass reports no contact.',
    'Welcome back. The blocks remember.',
    'That was quick. Grass is hard to find, huh.',
  ],
  tax: [
    "Relax, it's fake. Your aura's fine. Your posture isn't.",
    'The tax is fake. The judgment is real.',
    'Nothing was taken. Fanum left a receipt though.',
  ],
  npc: [
    'NPC DETECTED. Three bad placements. Press X to doubt.',
    'That pattern repeats like a background character. Is that you?',
    'Chat, I think the player is on a fixed walking route.',
  ],
  grindset: [
    'SIGMA GRINDSET: 4AM. Cold shower. Stack blocks. Repeat.',
    'SIGMA GRINDSET: They laughed at your stack. They were right. Keep going.',
    'SIGMA GRINDSET: Rise. Clear. Clear. Get told it was mid anyway.',
  ],
  ambient: [
    'The blocks are a metaphor. For blocks.',
    'My therapist says I\'m not real. I\'m a neuron. I don\'t have a therapist.',
    "We've been trying to reach you about your tetromino's extended warranty.",
    'Fun fact: none of this is on your résumé.',
    'I used to have friends. They were called the other brain cells.',
    'Somewhere, someone is studying. Not here though.',
    'Does the I-piece dream? Not relevant. Watch the stack.',
    'This is the longest you have focused on anything since 2019.',
  ],
};

const PIECE_QUIPS = {
  I: 'The Sigma has entered. It does not explain itself.',
  O: "It's Ohio. It doesn't rotate. It doesn't need to.",
  T: 'The Rizzler. Fits anywhere. Says so constantly.',
  S: 'Sus spawned. Watch it. Just… watch it.',
  Z: 'NPC spawned. It has one line of dialogue and this is it.',
  J: 'Fanum is here. Hide your snacks.',
  L: 'Skibidi. Nobody knows what it means, including it.',
};

const CHAT_USERS = [
  ['aurafarmer2011', '#b6ff00'], ['mid_energy', '#12b8ff'], ['ohio_tourist', '#ff7a18'],
  ['grass_avoider', '#ff1fa8'], ['npc_4471', '#a9a9c8'], ['rizzless_wonder', '#a93cff'],
  ['mod_of_nothing', '#ffe600'], ['definitely_not_a_bot', '#21e6c1'], ['your_moms_ipad', '#ff8fd0'],
  ['sigma_intern', '#7f9dff'],
];

const CHAT = {
  start: ['first', 'we are so back', 'who let them play', 'this guy again?', 'chat is this real', 'W stream', 'L stream, calling it now'],
  small: ['mid', 'ok and?', 'my grandma clears more', 'clap. clap.', 'wow one line', 'bro thinks that counts', 'real ones saw that', 'W?'],
  good: ['LETS GOOO', 'W W W W', 'hold up he might be him', 'ok that was clean', 'aura farming fr', 'chat we are so back', 'clip it', 'peak'],
  huge: ['ABSOLUTE CINEMA', 'CLIP IT CLIP IT CLIP IT', 'HE IS HIM', 'I HAVE NEVER SEEN THIS IN MY LIFE', 'W W W W W W W', 'my dad came back', 'SOMEONE CHECK ON OHIO', '🔥🔥🔥🔥🔥'],
  bad: ['L', 'what was that', 'NOT LIKE THIS', 'bro is cooked', 'uninstall', '💀💀💀', 'negative aura', 'he is NOT him', 'i felt that in my knees', 'who taught you this'],
  danger: ['ITS OVER', 'CHAT PRAY', 'we are so cooked', 'goodbye everyone', 'skill issue tbh', 'my wifi is better than this stack', 'clip the funeral'],
  over: ['F', 'F in chat', 'its so over', 'ggs i guess', 'unsubbed', 'same time tomorrow?', 'i could do better (i have not tried)'],
  idle: ['lurking', 'anyone else here for the block', 'what game is this', 'mods?', 'hi mom', 'is he good', 'first', 'skibidi', 'no thoughts', 'whats the wifi password'],
  tax: ['FANUM GOT HIM', 'tax szn', 'pay up', 'is that even legal'],
  weird: ['WHERE ARE WE', 'the eye is looking at me', 'I HAVE SEEN OHIO', 'why is it beautiful', 'mods make it stop'],
  pause: ['hes running', 'coward', 'grass arc?', 'bio break'],
};

const FLOATS = ['SKIBIDI', 'WHAT THE SIGMA', 'NEGATIVE AURA', 'LET HIM COOK', 'OHIO MENTIONED', 'CERTIFIED MID', 'AURA DEFICIT', 'BRO???', 'SIDE QUEST', 'NO THOUGHTS', 'RATIO', 'TOUCH GRASS', 'SIGMA GRINDSET', 'NPC BEHAVIOR', 'CHAT???', 'LOCKED IN'];
const FLOAT_COLORS = ['#b6ff00', '#ff1fa8', '#12b8ff', '#a93cff', '#fff200'];
const FAKE_WARNINGS = [
  '⚠ YOUR AURA IS BEING AUDITED',
  '⚠ OHIO.EXE HAS STOPPED CARING',
  '⚠ 14 BOTS ARE WATCHING YOU STACK',
  '⚠ BOARD INTEGRITY: VIBES ONLY',
  '⚠ SIGMA LEVELS BELOW LEGAL LIMIT',
  '⚠ THIS IS A FAKE WARNING. PROBABLY.',
  '⚠ YOUR ROOM IS DARK AND IT IS 3AM',
  '⚠ DOWNLOADING MORE BRAIN CELLS… FAILED',
];
const CAMEOS = ['🗿', '💀', '🧠', '👁️', '🤡', '🐸', '🦆'];
const RANKS = [
  [0, 'Certified NPC'],
  [800, 'Ohio Resident'],
  [2500, 'Professional Yapper'],
  [6000, 'Side Quest Protagonist'],
  [12000, 'Aura Farmer'],
  [25000, 'Sigma in Training'],
  [50000, 'Main Character'],
  [100000, 'Supreme Rizz Overlord'],
];

const DANGER_ON = 15;
const DANGER_OFF = 11;

const Rot = (() => {
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const randRange = (r) => (r ? rand(r[0], r[1]) : Infinity);
  const sample = (list) => list[Math.floor(Math.random() * list.length)];
  const mode = () => MODES[settings.mode];

  // Each category deals its lines like a shuffled deck, so nothing repeats until they've all been used.
  const decks = {};
  function pick(category) {
    let deck = decks[category];
    if (!deck || deck.length === 0) {
      deck = LINES[category].slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      decks[category] = deck;
    }
    return deck.pop();
  }

  let sayUntil = 0;
  let sayPriority = 0;
  let moodTimer = null;

  function setMood(mood, ms = 0) {
    const cell = $('cell');
    cell.dataset.mood = mood;
    clearTimeout(moodTimer);
    if (ms) moodTimer = setTimeout(() => { cell.dataset.mood = danger ? 'panic' : 'ok'; }, ms);
  }

  function sayText(text, priority = 1) {
    const now = performance.now();
    if (now < sayUntil && priority <= sayPriority && priority < 3) return false;
    $('say').textContent = text;
    sayPriority = priority;
    // A line said under a banner keeps its full reading time once the banner clears.
    sayUntil = Math.max(now, bannerUntil) + Math.min(1500 + text.length * 32, 3800);
    const cell = $('cell');
    cell.classList.remove('talk');
    void cell.getBoundingClientRect();
    cell.classList.add('talk');
    return true;
  }

  function say(category, priority = 1, n) {
    return sayText(pick(category).replace('{n}', n), priority);
  }

  let bannerUntil = 0;
  let bannerTimer = null;

  function banner(text, kind = '', ms = 1800, force = false) {
    const now = performance.now();
    if (!force && now < bannerUntil) return false;
    const el = $('banner');
    el.hidden = true;
    void el.offsetWidth;
    el.textContent = text;
    el.className = kind;
    el.hidden = false;
    bannerUntil = now + ms;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { el.hidden = true; }, ms);
    return true;
  }

  function clearBanner() {
    clearTimeout(bannerTimer);
    bannerUntil = 0;
    $('banner').hidden = true;
  }

  // Fake chat and viewer count
  let viewers = 4;

  function setViewers(n) {
    viewers = Math.max(1, Math.round(n));
    $('viewers').textContent = viewers === 1 ? '👁 1 watching (your mom)' : `👁 ${viewers.toLocaleString()} watching`;
  }

  function addChat(text) {
    const list = $('chat');
    const [name, color] = sample(CHAT_USERS);
    const row = document.createElement('li');
    const user = document.createElement('b');
    user.textContent = `${name}: `;
    user.style.color = color;
    row.append(user, text);
    list.append(row);
    while (list.children.length > 28) list.firstChild.remove();
  }

  const chatTimers = [];

  function chat(category, count = 1) {
    for (let i = 0; i < count; i++) {
      chatTimers.push(setTimeout(() => addChat(sample(CHAT[category])), i * rand(90, 240)));
    }
  }

  // Effects that sit behind the game
  let shakeAmount = 0;

  function shake(amount) {
    if (settings.reduced) return;
    shakeAmount = Math.min(14, Math.max(shakeAmount, amount * mode().shake));
  }

  let lastFlash = 0;

  // Limited to under three flashes a second, and off entirely with reduced motion.
  function flash(color, strength = 0.55) {
    const now = performance.now();
    if (settings.reduced || now - lastFlash < 400) return;
    lastFlash = now;
    const el = $('flash');
    el.style.transition = 'none';
    el.style.background = color;
    el.style.opacity = String(strength);
    void el.offsetWidth;
    el.style.transition = 'opacity .32s ease-out';
    el.style.opacity = '0';
  }

  function floatText(text, { color = sample(FLOAT_COLORS), cameo = false } = {}) {
    const layer = $('floats');
    if (layer.children.length > 14) return;
    const el = document.createElement('div');
    el.className = cameo ? 'float cameo' : 'float';
    el.textContent = text;
    el.style.color = color;
    el.style.setProperty('--r', `${rand(-16, 16).toFixed(1)}deg`);
    const well = $('well').getBoundingClientRect();
    const onLeft = Math.random() < 0.5;
    const room = onLeft ? well.left : window.innerWidth - well.right;
    const estimate = cameo ? 160 : text.length * 24;
    const span = Math.max(0, room - estimate);
    el.style.left = `${Math.max(0, onLeft ? rand(0, span) : well.right + rand(0, span))}px`;
    el.style.top = `${rand(4, 86)}%`;
    layer.append(el);
    setTimeout(() => el.remove(), cameo ? 3700 : 2900);
  }

  // Text and particles on the board. The big text is painted behind the blocks.
  const boardTexts = [];
  const particles = [];

  function boardText(ctx, lines, color, life = 1200) {
    const W = ctx.canvas.width;
    const wrapped = [];
    ctx.font = '400 96px Impact, Haettenschweiler, "Arial Black", sans-serif';
    for (const line of lines) {
      let current = '';
      for (const word of line.split(' ')) {
        const test = current ? `${current} ${word}` : word;
        if (current && ctx.measureText(test).width > W * 0.95) {
          wrapped.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      wrapped.push(current);
    }
    boardTexts.length = 0;
    boardTexts.push({ lines: wrapped, color, life, max: life });
  }

  function drawBehind(ctx, dt) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    for (let i = boardTexts.length - 1; i >= 0; i--) {
      const t = boardTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        boardTexts.splice(i, 1);
        continue;
      }
      const p = 1 - t.life / t.max;
      const scale = settings.reduced ? 1 : Math.min(1, 0.6 + p * 6);
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, (t.life / t.max) * 1.1);
      ctx.translate(W / 2, H * 0.36);
      ctx.scale(scale, scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = t.color;
      t.lines.forEach((line, i2) => {
        ctx.font = '400 96px Impact, Haettenschweiler, "Arial Black", sans-serif';
        const w = ctx.measureText(line).width;
        if (w > W * 0.95) ctx.font = `400 ${Math.floor(96 * (W * 0.95) / w)}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
        ctx.fillText(line, 0, (i2 - (t.lines.length - 1) / 2) * 100);
      });
      ctx.restore();
    }
  }

  function burst(rows, cols, cell, hidden, colors) {
    if (settings.reduced) return;
    for (const y of rows) {
      for (let x = 0; x < cols; x += 2) {
        if (particles.length > 160) return;
        particles.push({
          x: (x + 0.5) * cell,
          y: (y - hidden + 0.5) * cell,
          vx: rand(-0.7, 0.7),
          vy: rand(-0.9, 0.1),
          life: rand(280, 520),
          size: rand(8, 18),
          color: sample(colors),
        });
      }
    }
  }

  function drawFront(ctx, dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.003 * dt;
      ctx.globalAlpha = Math.min(1, p.life / 200);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // Animated background
  const bg = { ctx: null, w: 0, h: 0, emoji: [], sprites: new Map(), confetti: [], incident: 0, dirty: true, t: 0 };

  function emojiSprite(char) {
    if (!bg.sprites.has(char)) {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      const x = c.getContext('2d');
      x.font = '72px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(char, 48, 52);
      bg.sprites.set(char, c);
    }
    return bg.sprites.get(char);
  }

  function resizeBg() {
    const c = $('bg');
    bg.w = c.width = window.innerWidth;
    bg.h = c.height = window.innerHeight;
    bg.ctx = c.getContext('2d');
    bg.dirty = true;
  }

  function fillEmoji() {
    const want = mode().emoji;
    while (bg.emoji.length < want) {
      bg.emoji.push({
        char: sample(CAMEOS),
        x: Math.random(),
        y: Math.random(),
        v: rand(0.012, 0.04),
        size: rand(26, 72),
        phase: rand(0, 6),
        alpha: rand(0.14, 0.38),
      });
    }
    bg.emoji.length = want;
  }

  function drawGrid(ctx, t, hueBase) {
    const { w, h } = bg;
    const horizon = h * 0.52;
    ctx.lineWidth = 1;
    ctx.strokeStyle = `hsla(${hueBase}, 100%, 60%, .34)`;
    ctx.beginPath();
    for (let i = -14; i <= 14; i++) {
      ctx.moveTo(w / 2 + i * 16, horizon);
      ctx.lineTo(w / 2 + i * w * 0.18, h);
    }
    const scroll = settings.reduced ? 0 : (t * 0.4) % 1;
    for (let i = 0; i < 10; i++) {
      const p = (i + scroll) / 10;
      const y = horizon + (h - horizon) * p * p;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  function drawIncident(ctx, t) {
    const { w, h } = bg;
    ctx.fillStyle = '#123b10';
    ctx.fillRect(0, 0, w, h);
    const size = Math.max(w, h) / 14;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y) % 2) continue;
        const wob = settings.reduced ? 0 : Math.sin(t * 2 + x * 0.7 + y * 0.5) * 10;
        ctx.fillStyle = `hsl(${(x * 22 + t * 70) % 360}, 90%, 28%)`;
        ctx.fillRect(x * size + wob, y * size - wob, size, size);
      }
    }
    const count = 5;
    for (let i = 0; i < count; i++) {
      const ex = (w * (i + 0.5)) / count;
      const ey = h * (0.22 + 0.56 * ((i * 2) % 3) / 2);
      const r = Math.min(w, h) * (i % 2 ? 0.1 : 0.15);
      const look = settings.reduced ? 0 : Math.sin(t * 1.7 + i);
      ctx.fillStyle = '#f4ffd2';
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 1.3, r * (0.7 + (settings.reduced ? 0 : Math.abs(Math.sin(t * 1.3 + i)) * 0.3)), 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#ff1fa8';
      ctx.beginPath();
      ctx.arc(ex + look * r * 0.5, ey, r * 0.42, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#07020f';
      ctx.beginPath();
      ctx.arc(ex + look * r * 0.5, ey, r * 0.2, 0, 7);
      ctx.fill();
    }
  }

  function drawBg(dt) {
    if (!bg.ctx) resizeBg();
    if (settings.reduced && !bg.dirty) return;
    bg.dirty = false;
    const seconds = dt / 1000;
    bg.t += seconds;
    const ctx = bg.ctx;
    const { w, h, t } = bg;
    if (bg.incident > 0) {
      drawIncident(ctx, t);
      return;
    }
    const hue = settings.mode === 'ohio' ? (t * 26) % 360 : settings.mode === 'online' ? 280 + Math.sin(t * 0.5) * 50 : 285;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0a0314');
    sky.addColorStop(0.55, `hsl(${hue}, 70%, 12%)`);
    sky.addColorStop(1, '#07020f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    drawGrid(ctx, t, (hue + 40) % 360);

    fillEmoji();
    for (const e of bg.emoji) {
      if (!settings.reduced) {
        e.y -= e.v * seconds;
        if (e.y < -0.1) {
          e.y = 1.1;
          e.x = Math.random();
        }
      }
      const wobble = settings.reduced ? 0 : Math.sin(t + e.phase) * 22;
      ctx.globalAlpha = e.alpha;
      ctx.drawImage(emojiSprite(e.char), e.x * w + wobble, e.y * h, e.size, e.size);
    }
    ctx.globalAlpha = 1;

    for (let i = bg.confetti.length - 1; i >= 0; i--) {
      const c = bg.confetti[i];
      c.life -= dt;
      if (c.life <= 0) {
        bg.confetti.splice(i, 1);
        continue;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 0.0006 * dt;
      ctx.globalAlpha = Math.min(1, c.life / 300);
      ctx.drawImage(emojiSprite(c.char), c.x, c.y, c.size, c.size);
    }
    ctx.globalAlpha = 1;
  }

  function confetti(chars, count = 70) {
    if (settings.reduced) return;
    for (let i = 0; i < count; i++) {
      bg.confetti.push({
        char: sample(chars),
        x: rand(0, bg.w),
        y: rand(bg.h * 0.4, bg.h),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.75, -0.25),
        size: rand(24, 64),
        life: rand(900, 1700),
      });
    }
  }

  // Run state
  let danger = false;
  let dangerNag = 0;
  let timers = {};
  let idleFor = 0;
  let taxCooldown = 0;
  let recent = [];
  let lastWasBad = false;
  let holdsThisWindow = 0;
  let holdWindow = 0;
  let squareSpins = 0;
  let pieceSpins = 0;
  let quipsGiven = {};
  let peakAnnounced = false;
  let runCount = 0;
  let rizzTimer = null;

  function resetTimers() {
    const m = mode();
    timers = {
      float: randRange(m.float),
      chat: randRange(m.chat),
      ambient: randRange(m.ambient),
      warn: randRange(m.warn),
      cameo: randRange(m.cameo),
      incident: randRange(m.incident),
    };
  }

  function setDanger(on) {
    danger = on;
    document.body.classList.toggle('danger', on);
    if (on) Sfx.alarmOn();
    else Sfx.alarmOff();
  }

  function endIncident() {
    bg.incident = 0;
    bg.dirty = true;
  }

  function startIncident() {
    bg.incident = 3400;
    bg.dirty = true;
    banner('🌀 OHIO INCIDENT: REALITY HAS BEEN PATCHED', 'weird', 1800);
    sayText(sample(['Nobody panic. I said nobody panic.', 'Why are there eyes. Who approved the eyes.', 'We have left the map. The board is fine. I am not.', 'Do not look at it. It has already looked at you.']), 2);
    Sfx.ohio();
    chat('weird', 3);
    floatText('WELCOME TO OHIO', { color: '#b6ff00' });
  }

  function fanumTax() {
    const fake = Math.round(score * 0.3);
    stats.taxes++;
    if (!banner(`🏛 FANUM TAX: ${fake.toLocaleString()} AURA (30%) SEIZED`, 'tax', 1800)) return;
    Sfx.chaChing();
    const chip = $('tax-chip');
    chip.textContent = `-${fake.toLocaleString()} (not really)`;
    chip.hidden = false;
    setTimeout(() => { chip.hidden = true; }, 1800);
    setTimeout(() => { if (state === 'playing') say('tax', 2); }, 1100);
    chat('tax', 2);
  }

  function reactToClear(i) {
    const n = i.lines;
    const ctx = boardCanvasCtx();
    const colors = ['#ffffff', '#b6ff00', '#ff1fa8', '#12b8ff', '#a93cff'];
    burst(i.rows, COLS, CELL, HIDDEN_ROWS, colors);
    let label = `+${i.gained.toLocaleString()} AURA`;
    if (n >= 3) label = `+${i.gained.toLocaleString()} SIGMA AURA`;

    if (n === 4) {
      Sfx.tetris();
      shake(14);
      flash('#ff1fa8', 0.7);
      setViewers(viewers * rand(1.5, 2.1) + 40);
      chat('huge', 5);
      if (i.backToBack) {
        boardText(ctx, [label, 'INFINITE RIZZ UNLOCKED'], '#b6ff00', 1500);
        banner('♾ INFINITE RIZZ UNLOCKED ♾', 'rizz', 1800, true);
        say('backToBack', 3);
      } else {
        boardText(ctx, [label, 'RIZZ OVERLOAD'], '#ff1fa8', 1500);
        banner('💥 RIZZ OVERLOAD 💥', 'rizz', 1800, true);
        say('tetris', 3);
      }
      setMood('happy', 1800);
      confetti(['🔥', '💀', '🗿', '🧠', '👑', '✨']);
      if (!settings.reduced) {
        document.body.classList.add('rizz');
        clearTimeout(rizzTimer);
        rizzTimer = setTimeout(() => document.body.classList.remove('rizz'), 1400);
      }
      floatText('ABSOLUTE CINEMA');
      floatText("WE'RE SO BACK");
      floatText('LET HIM COOK');
    } else if (n === 3) {
      Sfx.triple();
      shake(8);
      flash('#a93cff', 0.45);
      setViewers(viewers * 1.25 + 8);
      boardText(ctx, [label], '#a93cff');
      chat('good', 3);
      say('triple', 2);
      setMood('happy', 1400);
    } else if (n === 2) {
      Sfx.bruh();
      shake(5);
      flash('#12b8ff', 0.3);
      setViewers(viewers * 1.08 + 3);
      boardText(ctx, [label, 'BRUH'], '#12b8ff');
      chat('good', 1);
      say('double', 2);
    } else {
      Sfx.single();
      shake(3);
      setViewers(viewers + rand(0, 3));
      boardText(ctx, [label], '#b6ff00', 1000);
      chat('small', 1);
      if (lastWasBad && Math.random() < 0.5) say('fixed', 2);
      else say('single', 2);
    }

    if (i.combo >= 1) Sfx.combo(i.combo);
    if (i.combo === 2) {
      sayText(pick('grindset'), 2);
      banner('💪 SIGMA GRINDSET ACTIVATED', '', 1800);
    } else if (i.combo >= 4 && i.combo % 2 === 0) {
      banner(`🏆 LEGENDARY OHIO COMBO x${i.combo + 1}`, 'rizz', 2000);
      boardText(ctx, [label, 'LEGENDARY OHIO COMBO'], '#fff200', 1300);
      say('combo', 2, i.combo + 1);
    } else if (i.combo >= 3) {
      say('combo', 1, i.combo + 1);
    }

    if (i.allClear) {
      say('allClear', 3);
      banner('🧼 THE BOARD IS EMPTY. WHAT DID YOU DO.', 'rizz', 1800, true);
    }

    const m = mode();
    if (n < 4 && score >= 300 && taxCooldown <= 0 && Math.random() < m.tax) {
      taxCooldown = m.taxCooldown;
      setTimeout(() => { if (state === 'playing') fanumTax(); }, 500);
    }
  }

  function reactToPlacement(i) {
    if (i.bad) {
      setViewers(viewers * 0.9 - 1);
      chat('bad', settings.mode === 'normal' ? 1 : 2);
      setMood('panic', 900);
      if (i.hardCells >= 12 && Math.random() < 0.45) say('yeet', 2);
      else if (i.holesAdded >= 2 && Math.random() < 0.55) say('holes', 2, i.holesAdded);
      else say('questionable', 2);
      if (Math.random() < 0.5) floatText(sample(['NEGATIVE AURA', 'BRO???', 'NPC BEHAVIOR', 'SKILL ISSUE']));

      const bads = recent.filter(Boolean).length;
      if (bads >= 3) {
        recent = [];
        banner('🤖 NPC DETECTED', 'warn', 1800);
        say('npc', 3);
        Sfx.warn();
      }
    } else if (i.wastedSigma) {
      say('wastedSigma', 2);
      chat('bad', 1);
    } else if (i.holesAdded <= 0 && Math.random() < 0.12) {
      say('clean', 1);
    }
  }

  function updateDanger(height) {
    if (!danger && height >= DANGER_ON) {
      setDanger(true);
      setMood('panic');
      banner('🚨 BRAIN CELL CRITICAL 🚨', 'critical', 1800, true);
      say('danger', 3);
      shake(6);
      chat('danger', 3);
      floatText("IT'S SO OVER", { color: '#ff2d2d' });
      dangerNag = 7;
    } else if (danger && height <= DANGER_OFF) {
      setDanger(false);
      setMood('happy', 1800);
      say('clutch', 3);
      chat('good', 3);
      setViewers(viewers * 1.3 + 12);
      floatText("WE'RE SO BACK");
    }
  }

  function boardCanvasCtx() {
    return $('board').getContext('2d');
  }

  return {
    drawBehind,
    drawFront,
    startIncident,
    fanumTax,
    resize: resizeBg,
    markBgDirty() {
      bg.dirty = true;
      bg.emoji.length = 0;
      resetTimers();
    },

    onStart(isRetry) {
      runCount++;
      setDanger(false);
      endIncident();
      clearBanner();
      setMood('ok');
      resetTimers();
      recent = [];
      lastWasBad = false;
      taxCooldown = 12;
      idleFor = 0;
      holdsThisWindow = 0;
      quipsGiven = {};
      peakAnnounced = false;
      sayUntil = 0;
      setViewers(isRetry ? Math.max(4, viewers * 0.6) : 4);
      $('tax-chip').hidden = true;
      if (isRetry) say('retry', 3, runCount);
      else say('start', 3);
      chat('start', 3);
    },

    onSpawn(type) {
      squareSpins = 0;
      pieceSpins = 0;
      if (!quipsGiven[type] && Math.random() < 0.35) {
        quipsGiven[type] = true;
        sayText(PIECE_QUIPS[type], 0);
      }
    },

    onInput() {
      idleFor = 0;
    },

    onRotate() {
      Sfx.rotate();
      pieceSpins++;
      if (pieceSpins === 8 || pieceSpins === 16) say('overthink', 2, pieceSpins);
    },

    onSquareSpin() {
      Sfx.rotate();
      squareSpins++;
      if (squareSpins === 2 || squareSpins % 4 === 0) say('squareSpin', 2, squareSpins);
    },

    onHold(worked) {
      if (!worked) {
        Sfx.denied();
        return;
      }
      Sfx.hold();
      holdsThisWindow++;
      if (holdsThisWindow >= 3) {
        holdsThisWindow = 0;
        say('holdSpam', 1);
      }
    },

    onHardDrop(cells) {
      Sfx.hardDrop(cells);
      shake(2 + Math.min(cells, 20) * 0.14);
    },

    onLock(i) {
      if (!i.hardCells) Sfx.softLock();
      recent.push(i.bad);
      if (recent.length > 5) recent.shift();
      if (i.lines > 0) reactToClear(i);
      else reactToPlacement(i);
      lastWasBad = i.bad;
      updateDanger(i.height);
      if (i.level > i.previousLevel) {
        Sfx.levelUp();
        say('levelUp', 2, i.level);
        floatText(`LEVEL ${i.level}`, { color: '#12b8ff' });
      }
      if (i.bestBefore > 0 && score > i.bestBefore && !peakAnnounced) {
        peakAnnounced = true;
        say('peak', 2);
        floatText('NEW PEAK AURA', { color: '#b6ff00' });
      }
    },

    onPause() {
      Sfx.alarmOff();
      const line = pick('pause');
      $('pause-line').textContent = line;
      chat('pause', 1);
    },

    onResume() {
      if (danger) Sfx.alarmOn();
      say('resume', 2);
      idleFor = 0;
    },

    onQuit() {
      setDanger(false);
      endIncident();
      clearBanner();
      setMood('ok');
      sayText('Your last brain cell is warming up.', 3);
    },

    onGameOver() {
      setDanger(false);
      endIncident();
      clearBanner();
      Sfx.gameOver();
      setMood('dead');
      say('gameOver', 3);
      chat('over', 4);
      shake(12);
      setViewers(Math.ceil(viewers * 0.1));
    },

    tick(dt) {
      drawBg(dt);

      if (shakeAmount > 0.3 && !settings.reduced) {
        const game = $('game');
        game.style.transform = `translate(${rand(-shakeAmount, shakeAmount).toFixed(1)}px, ${rand(-shakeAmount, shakeAmount).toFixed(1)}px)`;
        shakeAmount *= Math.pow(0.0035, dt / 400);
      } else if (shakeAmount !== 0) {
        shakeAmount = 0;
        $('game').style.transform = '';
      }

      if (bg.incident > 0) {
        bg.incident -= dt;
        if (bg.incident <= 0) endIncident();
      }

      if (state !== 'playing') return;

      const seconds = dt / 1000;
      // Chaos ramps up as the player climbs levels, up to double speed.
      const pace = seconds * Math.min(2, 1 + (level - 1) * 0.07);
      const m = mode();
      taxCooldown -= seconds;
      timers.float -= pace;
      timers.chat -= pace;
      timers.ambient -= pace;
      timers.warn -= pace;
      timers.cameo -= pace;
      timers.incident -= seconds;
      idleFor += seconds;

      holdWindow += seconds;
      if (holdWindow > 12) {
        holdWindow = 0;
        holdsThisWindow = 0;
      }

      if (timers.float <= 0) {
        timers.float = randRange(m.float);
        floatText(sample(FLOATS));
      }
      if (timers.chat <= 0) {
        timers.chat = randRange(m.chat);
        addChat(sample(danger ? CHAT.danger : CHAT.idle));
      }
      if (timers.ambient <= 0) {
        timers.ambient = randRange(m.ambient);
        say('ambient', 0);
      }
      if (timers.warn <= 0) {
        timers.warn = randRange(m.warn);
        if (banner(sample(FAKE_WARNINGS), 'warn', 2000)) Sfx.warn();
      }
      if (timers.cameo <= 0) {
        timers.cameo = randRange(m.cameo);
        floatText(sample(CAMEOS), { cameo: true });
      }
      if (timers.incident <= 0) {
        timers.incident = randRange(m.incident);
        if (!danger) startIncident();
      }
      if (idleFor > 8) {
        idleFor = 0;
        say('idle', 1);
      }
      if (danger) {
        dangerNag -= seconds;
        if (dangerNag <= 0) {
          dangerNag = rand(6, 10);
          say('danger', 1);
        }
      }
    },

    report(run) {
      let rank = RANKS[0][1];
      for (const [min, name] of RANKS) if (run.score >= min) rank = name;

      let sigma = 'Not found (404)';
      if (run.tetrises >= 5) sigma = 'Confirmed Sigma (self-reported)';
      else if (run.tetrises >= 2) sigma = 'Sigma Intern (unpaid)';
      else if (run.tetrises === 1) sigma = 'One-Hit Wonder';
      else if (run.lines >= 20) sigma = 'Grindset Pending';
      else if (run.lines > 0) sigma = 'Sigma Adjacent';

      const npc = run.pieces < 6
        ? 99.9
        : Math.max(1.2, Math.min(99.9, 4 + (run.bad / run.pieces) * 150 - run.tetrises * 4));

      let prognosis = 'Patient stacked blocks until the blocks won. Doctors are unsurprised.';
      if (run.lines === 0) prognosis = 'Zero lines cleared. The blocks did not even have to try.';
      else if (run.pieces < 20) prognosis = 'That was over faster than your attention span.';
      else if (run.holes >= 25) prognosis = `${run.holes} self-inflicted holes. Recommended career: cheese.`;
      else if (run.tetrises >= 3) prognosis = `${run.tetrises} four-line clears. Terrifying. Please go outside.`;
      else if (run.maxCombo >= 4) prognosis = `A ${run.maxCombo + 1}-clear streak. Briefly, you were somebody.`;
      else if (run.taxes >= 2) prognosis = `Survived ${run.taxes} fake tax audits. Owes nothing. Learned nothing.`;

      return {
        rank,
        prognosis,
        rows: [
          ['Total Aura Earned', run.score.toLocaleString()],
          ['Lines Cleared', run.lines.toLocaleString()],
          ['Maximum Brainrot Level', String(run.level)],
          ['Sigma Status', sigma],
          ['NPC Probability', `${npc.toFixed(1)}%`],
          ['Final Diagnosis', 'Chronically Online'],
        ],
        npc,
      };
    },
  };
})();
