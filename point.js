/*
  Glyde website: the Point & Ask demo, drawn rather than recorded.

  As the app does it (ScreenMarks, ExplainPanel, BoardPanel): Ctrl+Alt+Q, the island listens to the question and
  thinks, then Glyde answers out loud a sentence at a time. With each sentence its own pointer draws a mark (violet,
  with a soft glow), a label comes up beside it, and the matching line is written into the notes beside the screen,
  or, for a sum, into the working on a ruled board, the answer boxed in red.

  Plays only while on screen; with reduced motion it shows each example finished, and waits.
*/
(function () {
  'use strict';

  const stage = document.querySelector('.pa-screen');
  if (!stage || !window.WI) return;
  const { Island, V } = window.WI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SCENES = {
    photo: {
      asked: 'How do I make this small enough to email?',
      said: ['The Export button is down here.', 'Make it 1600 pixels wide.', 'At 80% quality it comes to about 1 MB.'],
    },
    maths: {
      asked: 'How do I do question 4?',
      said: ['It’s a right-angled triangle.', 'The ladder is the long side, so h² + 3² = 5².', 'So h² is 16, and h is 4 metres.'],
    },
    sheet: {
      asked: 'Why is my total wrong?',
      said: ['Your sum stops at row 6.', 'So the boat ride in row 7 isn’t counted.', 'Make it B2 to B7, and it’s 10,000.'],
    },
  };
  const ORDER = Object.keys(SCENES);

  // The spreadsheet's rows, drawn into its SVG.
  (function drawSheet() {
    const g = $('.sheet-grid', stage);
    const rows = [['', 'A', 'B', 'hd'], ['1', 'Item', '₹', 'b'], ['2', 'Train', '2,400'], ['3', 'Hostel', '3,600'], ['4', 'Food', '2,000'],
      ['5', 'Museum', '500'], ['6', 'Bus', '300'], ['7', 'Boat ride', '1,200'], ['8', 'Total', '8,800', 'tot']];
    let y = 140, out = '';
    rows.forEach(([n, a, b, kind], i) => {
      const h = i === 0 ? 30 : 44;
      const head = kind === 'hd';
      out += `<rect x="20" y="${y}" width="40" height="${h}" fill="#f3f3f7" stroke="#e3e3ea"/>`;
      out += `<rect x="60" y="${y}" width="340" height="${h}" fill="${head ? '#f3f3f7' : '#fff'}" stroke="#e3e3ea"/>`;
      out += `<rect x="400" y="${y}" width="180" height="${h}" fill="${kind === 'tot' ? '#fff1f1' : head ? '#f3f3f7' : '#fff'}" stroke="#e3e3ea"/>`;
      const ty = y + h / 2 + 6, cls = head ? 't-head' : kind === 'b' || kind === 'tot' ? 't-cell b' : 't-cell';
      out += `<text x="40" y="${ty}" text-anchor="middle" class="t-head">${n}</text>`;
      out += `<text x="${head ? 230 : 74}" y="${ty}"${head ? ' text-anchor="middle"' : ''} class="${cls}">${a}</text>`;
      out += `<text x="${head ? 490 : 566}" y="${ty}" text-anchor="${head ? 'middle' : 'end'}" class="${cls}${kind === 'tot' ? ' red' : ''}">${b}</text>`;
      y += h;
    });
    g.innerHTML = out;
  })();

  // The island at the top of the screen, the app's own views.
  const island = new Island($('#pa-island'));
  island.setNeutral?.(true);
  island.show(V.idle());
  window.dispatchEvent(new Event('resize')); // (sized to its screen with the page's others)

  const caption = $('.pa-caption');
  const keys = $('.pa-keys', stage);
  const pointer = $('.pa-pointer', stage);
  const replay = $('.pa-replay');
  const tabs = $$('.pa-tabs [role="tab"]');
  let scene = 'photo', token = 0, visible = false, played = false;

  const wait = (ms, mine) => new Promise((resolve, reject) => setTimeout(() => (mine === token ? resolve() : reject(new Error('stopped'))), ms));
  const inScene = sel => $$(`[data-for="${scene}"] ${sel}, ${sel}[data-for="${scene}"]`, stage);

  function reset(name) {
    scene = name;
    stage.dataset.scene = name;
    tabs.forEach(t => {
      const on = t.dataset.scene === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $('#pa-stage').setAttribute('aria-labelledby', `pa-tab-${name}`);
    $$('.mark', stage).forEach(m => { m.style.transition = 'none'; m.style.strokeDashoffset = '1'; });
    $$('.shown', stage).forEach(el => el.classList.remove('shown'));
    $$('.pa-notes li', stage).forEach(li => li.classList.remove('shown'));
    pointer.classList.remove('on');
    keys.classList.remove('on');
    caption.textContent = '';
    replay.hidden = true;
  }

  // Glyde's pointer, from wherever it is to a point (in the 1000 × 600 space).
  function pointAt(x, y, ms = 500) {
    pointer.style.transitionDuration = `${ms}ms`;
    pointer.style.left = `${x / 10}%`;
    pointer.style.top = `${y / 6}%`;
    pointer.classList.add('on');
  }

  // A mark drawn as a pen does, the pointer riding its tip.
  function draw(path, ms, mine) {
    return new Promise(resolve => {
      const length = path.getTotalLength();
      const start = path.getPointAtLength(0);
      pointAt(start.x, start.y, 420);
      setTimeout(() => {
        if (mine !== token) return resolve();
        pointer.style.transitionDuration = '0ms';
        const t0 = performance.now();
        const frame = now => {
          if (mine !== token) return resolve();
          const t = Math.min(1, (now - t0) / ms);
          const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          path.style.strokeDashoffset = String(1 - eased);
          const p = path.getPointAtLength(length * eased);
          pointer.style.left = `${p.x / 10}%`;
          pointer.style.top = `${p.y / 6}%`;
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        path.style.transition = 'none';
        requestAnimationFrame(frame);
      }, 440);
    });
  }

  function showStep(n) {
    inScene(`.pa-label[data-step="${n}"]`).forEach(el => el.classList.add('shown'));
    const notes = $(`.pa-notes[data-for="${scene}"]`, stage);
    if (notes) notes.querySelectorAll('li')[n - 1]?.classList.add('shown');
    inScene(`.bl[data-step="${n}"]`).forEach(el => el.classList.add('shown'));
  }

  async function play(name, auto) {
    const mine = ++token;
    reset(name);
    const data = SCENES[name];
    try {
      island.show(V.idle());
      await wait(700, mine);
      keys.classList.add('on');
      await wait(1000, mine);
      keys.classList.remove('on');
      island.show(V.siroListening(data.asked));
      caption.textContent = `“${data.asked}”`;
      await wait(2400, mine);
      island.show(V.siroThinking(data.asked));
      await wait(1300, mine);
      inScene('.pa-notes, .pa-board').forEach(el => el.classList.add('shown'));
      for (let n = 1; n <= 3; n++) {
        const line = data.said[n - 1];
        island.show(V.siroAnswer(data.asked, line));
        caption.textContent = line;
        const marks = inScene(`.mark[data-step="${n}"]`);
        if (!marks.length) showStep(n);
        for (const [i, mark] of marks.entries()) {
          await draw(mark, mark.classList.contains('hl') ? 650 : 900, mine);
          if (i === 0) showStep(n);
        }
        await wait(n === 3 ? 3000 : 2000, mine);
      }
      pointer.classList.remove('on');
      island.show(V.idle());
      replay.hidden = false;
      played = true;
      await wait(4500, mine);
      if (auto && visible) play(ORDER[(ORDER.indexOf(name) + 1) % ORDER.length], true);
    } catch (err) { /* a newer run took over */ }
  }

  // Everything at once, for reduced motion.
  function still(name) {
    token++;
    reset(name);
    const data = SCENES[name];
    $$('.mark', stage).forEach(m => { m.style.strokeDashoffset = '0'; });
    inScene('.pa-notes, .pa-board').forEach(el => el.classList.add('shown'));
    [1, 2, 3].forEach(showStep);
    island.show(V.siroAnswer(data.asked, data.said[2]));
    caption.textContent = data.said.join(' ');
  }

  tabs.forEach(tab => tab.addEventListener('click', () => (reduce ? still(tab.dataset.scene) : play(tab.dataset.scene, true))));
  $('.pa-tabs').addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = tabs[(ORDER.indexOf(scene) + step + ORDER.length) % ORDER.length];
    next.focus();
    next.click();
  });
  replay.addEventListener('click', () => play(scene, true));

  if (reduce) { still('photo'); return; }
  reset('photo');
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && (!played || replay.hidden === false)) play(scene, true);
    if (!visible) { token++; pointer.classList.remove('on'); }
  }, { threshold: 0.35 }).observe(stage);
})();
