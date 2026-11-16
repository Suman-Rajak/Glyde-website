/*
  Glyde website: dot-matrix art, as the app's Plans page draws it (DotMatrix.cs): small pictures on a grid of dots,
  the lit ones glowing a little in their colour and the unlit ones faintly there, as an LED panel's are; and words in
  the same 5×7 dot font. Drawn as SVG, so it's crisp at any size.

    <span data-dots="ghost" data-dot-color="#9a8cff"></span>       a picture: ghost, star, sparkle, robot
    <span data-dot-text="GLYDE PRO" data-dot-color="#fff"></span>  words, in capitals and figures
*/
(function () {
  'use strict';

  const PICTURES = {
    ghost: ['...#####...', '..#######..', '.#########.', '.##..#..##.', '.##..#..##.', '.#########.', '.#########.', '.#########.', '.#########.', '.##.###.##.', '.#...#...#.'],
    star: ['.....#.....', '.....#.....', '....###....', '....###....', '###########', '.#########.', '..#######..', '...#####...', '...##.##...', '..##...##..', '.##.....##.'],
    sparkle: ['.....#.....', '.....#.....', '.....#.....', '....###....', '...#####...', '###########', '...#####...', '....###....', '.....#.....', '.....#.....', '.....#.....'],
    robot: ['....#....', '....#....', '.#######.', '.#.....#.', '.#.#.#.#.', '.#.....#.', '.#.###.#.', '.#######.', '..#...#..'],
  };

  const FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    ' ': ['...', '...', '...', '...', '...', '...', '...'], '·': ['.', '.', '.', '#', '.', '.', '.'], '&': ['.##..', '#..#.', '.##..', '.##.#', '#..#.', '#..#.', '.##.#'],
  };

  const NS = 'http://www.w3.org/2000/svg';
  const svg = (w, h) => {
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    return el;
  };
  const circle = (x, y, r, fill, opacity) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${opacity != null ? ` fill-opacity="${opacity}"` : ''}/>`;

  // A picture: a soft glow under each lit dot, then the dots, lit and unlit (unit pitch).
  function picture(rows, colour) {
    const cols = Math.max(...rows.map(r => r.length));
    const el = svg(cols, rows.length);
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    let glow = '', dots = '';
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (c === '#') {
        glow += circle(cx, cy, 1.5, `url(#${id})`);
        dots += circle(cx, cy, 0.42, colour);
      } else {
        dots += circle(cx, cy, 0.3, colour, 0.14);
      }
    }));
    el.innerHTML = `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${colour}" stop-opacity=".23"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient></defs>${glow}${dots}`;
    return el;
  }

  // Words, in the 5×7 font, dots apart rather than a pixel font.
  function text(words, colour) {
    const glyphs = [...words.toUpperCase()].map(c => FONT[c] || FONT[' ']);
    const cols = Math.max(1, glyphs.reduce((n, g) => n + g[0].length + 1, 0) - 1);
    const el = svg(cols, 7);
    let left = 0, dots = '';
    glyphs.forEach(g => {
      g.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') dots += circle(left + x + 0.5, y + 0.5, 0.35, colour); }));
      left += g[0].length + 1;
    });
    el.innerHTML = dots;
    return el;
  }

  document.querySelectorAll('[data-dots]').forEach(el => {
    const rows = PICTURES[el.dataset.dots];
    if (rows) el.replaceChildren(picture(rows, el.dataset.dotColor || '#9a8cff'));
  });
  document.querySelectorAll('[data-dot-text]').forEach(el => {
    el.replaceChildren(text(el.dataset.dotText, el.dataset.dotColor || 'currentColor'));
  });

  window.GlydeDots = { picture, text, PICTURES };
})();
