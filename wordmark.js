/*
  Glyde website: the wordmark at the top of the page. The letters brighten where the pointer is
  (a soft light following it across them); polish.css does the rest (the glide in, the passing sheen).
*/
(function () {
  'use strict';

  const mark = document.querySelector('.wm-text');
  if (!mark || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.hero') || document.body;
  let frame = 0, x = 0, y = 0;

  hero.addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = mark.getBoundingClientRect();
      mark.style.setProperty('--mx', `${(x - box.left).toFixed(0)}px`);
      mark.style.setProperty('--my', `${(y - box.top).toFixed(0)}px`);
      mark.classList.add('lit');
    });
  }, { passive: true });
  hero.addEventListener('pointerleave', () => mark.classList.remove('lit'));
})();
