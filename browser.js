/*
  Glyde website: the browser control demo (Glyde AI, coming soon), drawn rather than recorded.

  You ask for something; the island listens and works it out, then says each step as Glyde's own pointer
  does it in the browser: types where you're going, picks the day, searches, sorts by price, and points
  at the answer. Booking is left to you. Plays only while on screen; still, with reduced motion.
*/
(function () {
  'use strict';

  const screen = document.querySelector('.bc-screen');
  if (!screen || !window.WI) return;
  const { Island, V, ICON } = window.WI;
  const $ = sel => screen.querySelector(sel);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caption = document.querySelector('.bc-caption');
  const pointer = $('.bc-pointer');
  const island = new Island(document.querySelector('#bc-island'));
  island.setNeutral?.(true);
  island.show(V.idle());
  window.dispatchEvent(new Event('resize'));

  const ASKED = 'Find the cheapest flight to Goa on Friday';
  const ANSWER = 'Cheapest is ₹4,820 at 6:10 am with Aster Air. Want me to open it? You book.';
  let token = 0, visible = false;

  const wait = (ms, mine) => new Promise((resolve, reject) => setTimeout(() => (mine === token ? resolve() : reject(new Error('stopped'))), ms));
  // The island while it works in the browser: the browser's sign, what it's doing, a turning ring.
  const working = text => ({
    key: 'bc-' + text, shape: [400, 40, 20], cls: 'v-agent-w',
    html: `<span class="ag-tile">${ICON.globe}</span><b class="ag-proj">Chrome</b><span class="ag-doing">${text}</span><span class="ag-spin" aria-hidden="true"></span>`,
  });
  const say = (text, view) => { caption.textContent = text; if (view) island.show(view); };

  function pointAt(sel, mine) {
    const target = $(sel);
    const box = target.getBoundingClientRect(), frame = screen.getBoundingClientRect();
    pointer.style.left = `${box.left - frame.left + box.width * 0.55}px`;
    pointer.style.top = `${box.top - frame.top + box.height * 0.6}px`;
    pointer.classList.add('on');
    return wait(750, mine);
  }
  async function click(sel, mine) {
    await pointAt(sel, mine);
    const target = $(sel);
    target.classList.add('pressed');
    pointer.classList.add('press');
    await wait(220, mine);
    pointer.classList.remove('press');
    target.classList.remove('pressed');
  }

  function reset() {
    screen.classList.remove('searched', 'sorted', 'working', 'found');
    $('.bc-typed').textContent = '';
    $('.bc-date').textContent = 'Any day';
    pointer.classList.remove('on');
    pointer.style.left = '70%'; pointer.style.top = '80%';
    caption.textContent = '';
  }

  async function run() {
    const mine = ++token;
    try {
      for (;;) {
        reset();
        island.show(V.idle());
        await wait(900, mine);
        say(`“${ASKED}”`, V.siroListening(ASKED));
        await wait(2700, mine);
        island.show(V.siroThinking(ASKED));
        await wait(1200, mine);
        screen.classList.add('working');

        say('Typing where you’re going', working('Typing the destination'));
        await click('[data-bc="to"]', mine);
        for (const ch of 'Goa') { $('.bc-typed').textContent += ch; await wait(150, mine); }
        await wait(300, mine);

        say('Picking Friday', working('Picking Friday'));
        await click('[data-bc="date"]', mine);
        $('.bc-date').textContent = 'Fri, 20 Nov';
        await wait(500, mine);

        say('Searching', working('Searching flights'));
        await click('[data-bc="search"]', mine);
        screen.classList.add('searched');
        await wait(1100, mine);

        say('Sorting by price', working('Sorting by price'));
        await click('[data-bc="sort"]', mine);
        screen.classList.add('sorted');
        await wait(900, mine);

        await pointAt('.bc-row[data-price="4820"]', mine);
        screen.classList.add('found');
        screen.classList.remove('working');
        say(ANSWER, V.siroAnswer(ASKED, ANSWER));
        await wait(5200, mine);
        pointer.classList.remove('on');
        await wait(1500, mine);
      }
    } catch (err) { /* stopped: off screen, or a newer run */ }
  }

  function finished() {
    $('.bc-typed').textContent = 'Goa';
    $('.bc-date').textContent = 'Fri, 20 Nov';
    screen.classList.add('searched', 'sorted', 'found');
    screen.classList.remove('working');
    pointer.classList.remove('on');
    island.show(V.siroAnswer(ASKED, ANSWER));
    caption.textContent = ANSWER;
  }
  const paused = () => document.documentElement.classList.contains('still');
  document.addEventListener('glyde:still', e => {
    if (e.detail) { token++; finished(); } else if (visible) run();
  });
  if (reduce) {
    $('.bc-typed').textContent = 'Goa';
    $('.bc-date').textContent = 'Fri, 20 Nov';
    screen.classList.add('searched', 'sorted', 'found');
    island.show(V.siroAnswer(ASKED, ANSWER));
    caption.textContent = ANSWER;
    return;
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && paused()) { finished(); return; }
    if (visible) run(); else { token++; reset(); }
  }, { threshold: 0.35 }).observe(screen);
})();
