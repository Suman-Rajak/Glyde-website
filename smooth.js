/*
  Glyde website: smooth wheel scrolling. A mouse wheel's notches (and a touchpad's flicks) glide the page to where
  they point, easing in and out, instead of jumping.

  Only for wheels and touchpads on pointer devices. Touch screens, the keyboard, the scrollbar and links keep the
  browser's own scrolling, and the script steps aside for zooming (Ctrl + wheel), sideways scrolling, anything that
  scrolls inside the page (a list, a text box) and for anyone who asks for less motion.
*/
(function () {
  'use strict';

  const fine = window.matchMedia('(pointer: fine)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.scrollingElement || document.documentElement;
  const EASE = 0.14;          // how much of the way it goes each frame (at 60 fps): higher is snappier
  const LINE = 40;            // a "line" of wheel scroll, in pixels (Firefox reports lines)

  let target = window.scrollY, current = window.scrollY, raf = 0, last = 0;

  const maxScroll = () => root.scrollHeight - window.innerHeight;
  const enabled = () => fine.matches && !reduce.matches;

  // Something between the pointer and the page that can still scroll this way itself (keep the wheel there).
  function scrollsItself(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      const style = getComputedStyle(el);
      if (!/(auto|scroll)/.test(style.overflowY)) continue;
      if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
    }
    return false;
  }

  function frame(now) {
    const dt = Math.min(64, now - (last || now - 16.7));
    last = now;
    const t = 1 - Math.pow(1 - EASE, dt / 16.7); // the same feel at 60, 120 or 144 Hz
    current += (target - current) * t;
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo({ top: current, behavior: 'instant' });
    raf = current === target ? 0 : requestAnimationFrame(frame);
    if (!raf) last = 0;
  }

  window.addEventListener('wheel', e => {
    if (!enabled() || e.ctrlKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? LINE : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || scrollsItself(e.target, dy)) return;
    e.preventDefault();
    if (!raf) { current = window.scrollY; target = current; }
    target = Math.max(0, Math.min(maxScroll(), target + dy));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: false });

  // Something else is about to scroll the page (keys, the scrollbar, a link, a finger): let it, and carry on from
  // wherever it leaves the page next time (the position is read again when the wheel next turns).
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } };
  ['keydown', 'pointerdown', 'touchstart', 'click'].forEach(type => window.addEventListener(type, stop, { passive: true, capture: true }));
  window.addEventListener('resize', () => { target = Math.min(target, maxScroll()); }, { passive: true });
})();
