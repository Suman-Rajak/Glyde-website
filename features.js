/*
  Glyde website: the feature explorer. Every feature, one at a time, on one screen: pick a group, then a
  feature, and the island acts it out with the app's own views (island.js). While it's on screen and
  nobody's picking, it plays through the group by itself.
*/
(function () {
  'use strict';

  const root = document.querySelector('.fx');
  if (!root || !window.WI) return;
  const { Island, V, player } = window.WI;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const screen = $('.fx-screen', root);
  const caption = $('.fx-caption', root);
  const island = new Island($('#fx-island'));
  island.setNeutral?.(true);
  island.show(V.idle());
  window.dispatchEvent(new Event('resize'));

  const message = {
    app: 'Messages', title: 'Priya', letter: 'P', colors: ['#ff9a8b', '#ff5f8f'],
    body: 'Dinner at 8? I found the perfect place', long: 'Dinner at 8? I found the perfect place by the lake. Booking for four unless you say no.',
  };

  // What each feature plays: [view, how long] steps, or a function returning them.
  const timer = () => {
    const steps = [];
    for (let s = 545; s > 540; s--) steps.push([V.timerCountdown('Pasta', s), 1000]);
    steps.push([V.timerRinging('Pasta', '10 minute timer'), 2600]);
    return steps;
  };
  const PLAYS = {
    music: () => { player.play?.(); return [[V.mediaCompact(), 1800], [V.mediaExpanded(true), 4200]]; },
    call: [[V.call('Maya'), 4200]],
    notification: [[V.notification(message), 2600], [V.notificationExpanded(message), 3200]],
    meeting: [[V.meeting('Design review', 'in 4 min'), 4000]],
    download: [[V.download(), 2600], [V.copying(42), 1600], [V.copying(81), 1600]],
    level: [[V.level('volume', 38), 700], [V.level('volume', 52), 700], [V.level('volume', 66), 1400], [V.level('brightness', 72), 1600]],
    battery: [[V.battery(64), 2400], [V.bluetooth('Aurora Buds Pro', 80), 2400]],
    privacy: [[V.privacy('Discord'), 2400], [V.privacy('Teams', 'Camera'), 2400]],
    score: [[V.score(), 4000]],
    timer,
    clipboard: [[V.clipboard(), 4600]],
    shelf: [[V.shelf(), 4400]],
    notes: [[V.notes(), 4400]],
    focus: [[V.focusLive('8:40', 0.35), 2400], [V.focus(), 2800]],
    prompter: [[V.prompterLive(), 5200]],
    menubar: [[V.idle(), 4600]],
    search: [[V.idle(), 4600]],
    agentWorking: [[V.agentWorking('website', 'Reading pricing.css'), 1500], [V.agentWorking('website', 'Editing pricing.css'), 1800], [V.agentWorking('website', 'Running the tests'), 1600]],
    agentNeedsYou: [[V.agentNeedsYou('glyde', 'git push origin main'), 3000], [V.agents(), 3600]],
    agentDanger: [[V.agentDanger(), 4600], [V.agentWorking('website', 'Denied. Finding a safer way'), 2400]],
    agentDone: [[V.agentWorking('website', 'Running the tests'), 1600], [V.agentDone(), 3600]],
    agents: [[V.agents(), 5200]],
  };
  // Features shown by something on the screen other than the island.
  const SCREEN = { menubar: 'show-menubar', search: 'show-search' };

  const tabs = $$('[role="tab"]', root);
  let group = 'live', token = 0, visible = false, heldUntil = 0;

  const wait = (ms, mine) => new Promise((resolve, reject) => setTimeout(() => (mine === token ? resolve() : reject(new Error('stopped'))), ms));
  const items = () => $$(`.fx-list[data-group="${group}"] [data-fx]`, root);

  function mark(button) {
    $$('[data-fx]', root).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    caption.textContent = button ? button.querySelector(':scope > span').textContent : '';
  }

  async function play(button, mine) {
    const key = button.dataset.fx;
    mark(button);
    screen.classList.remove(...Object.values(SCREEN));
    if (SCREEN[key]) screen.classList.add(SCREEN[key]);
    const plan = typeof PLAYS[key] === 'function' ? PLAYS[key]() : PLAYS[key];
    for (const [view, ms] of plan) {
      island.show(view);
      if (reduce) return;
      await wait(ms, mine);
    }
  }

  // Through the group, one feature after another, while nobody is choosing.
  async function tour(startAt = 0) {
    const mine = ++token;
    try {
      for (let i = startAt; ; i = (i + 1) % items().length) {
        await play(items()[i], mine);
        if (reduce) return;
        await wait(500, mine);
        if (Date.now() < heldUntil) await wait(heldUntil - Date.now(), mine);
      }
    } catch (err) { /* a newer run took over */ }
  }

  function setGroup(name, start = true) {
    group = name;
    tabs.forEach(t => {
      const on = t.dataset.group === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $$('.fx-list', root).forEach(list => { list.hidden = list.dataset.group !== name; });
    if (start) tour(0);
  }

  tabs.forEach(t => t.addEventListener('click', () => setGroup(t.dataset.group)));
  $('.fx-groups', root).addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = tabs.findIndex(t => t.dataset.group === group);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });
  // Picking a feature plays it, then carries on through the group from there after a pause.
  root.addEventListener('click', e => {
    const button = e.target.closest('[data-fx]');
    if (!button) return;
    heldUntil = Date.now() + 6000;
    tour(items().indexOf(button));
  });

  const paused = () => document.documentElement.classList.contains('still');
  document.addEventListener('glyde:still', e => {
    if (e.detail) token++;
    else if (visible) tour(Math.max(0, items().findIndex(b => b.getAttribute('aria-pressed') === 'true')));
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && paused()) { if (!items().some(b => b.getAttribute('aria-pressed') === 'true')) play(items()[0], token); return; }
    if (visible) tour(Math.max(0, items().findIndex(b => b.getAttribute('aria-pressed') === 'true')));
    else token++;
  }, { threshold: 0.3 }).observe(root);

  if (reduce) play(items()[0], token);
})();
