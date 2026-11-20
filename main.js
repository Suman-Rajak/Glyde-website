/* Glyde website: everything on the page that isn't the island itself. */
(function () {
  'use strict';

  const { Island, V, ICON, TRACKS, player, voice, artHTML, faceHTML, reduceMotion, sleep, esc } = window.WI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---- Pausing animations --------------------------------------------------------------------
  // "Pause animations" stops what moves by itself: the islands' little stories, the demos
  // and the page's looping glows.
  // Remembered on this device. Everything still works when you use it.

  let still = false;
  try { still = localStorage.getItem('glyde-still') === '1'; } catch (err) { /* storage blocked */ }
  const directors = [];
  const whenStillChanges = [];
  class Director extends window.WI.Director {
    constructor(...args) {
      super(...args);
      directors.push(this);
      if (still) this.pauseUntil = Infinity;
    }
  }
  // An island left alone for a while after you've used it (forever, while paused).
  const hold = (director, ms) => { director.pauseUntil = still ? Infinity : Date.now() + ms; };

  function setStill(on, save = true) {
    still = on;
    document.documentElement.classList.toggle('still', on);
    directors.forEach(d => { d.pauseUntil = on ? Infinity : 0; });
    $$('[data-motion-toggle]').forEach(b => {
      b.setAttribute('aria-pressed', String(on));
      const label = b.querySelector('.mt-label') || b;
      label.textContent = on ? 'Play animations' : 'Pause animations';
      b.title = label.textContent;
    });
    document.dispatchEvent(new CustomEvent('glyde:still', { detail: on })); // (the demos in their own scripts)
    if (save) try { localStorage.setItem('glyde-still', on ? '1' : '0'); } catch (err) { /* storage blocked */ }
    whenStillChanges.forEach(fn => fn(on));
  }
  $$('[data-motion-toggle]').forEach(b => b.addEventListener('click', () => setStill(!still)));
  if (reduceMotion) $$('.motion-row').forEach(row => { row.hidden = true; }); // (nothing loops then anyway)

  // Links and the waitlist backend live in config.js.
  const CONFIG = window.WINISLAND || {};
  // Can the browser move things with the scroll by itself (CSS scroll-driven animations)? Then no script does it.
  const scrollDriven = Boolean(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'));
  const LAUNCHED = Boolean(CONFIG.downloadUrl || CONFIG.storeUrl);
  document.documentElement.classList.toggle('launched', LAUNCHED);

  $$('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon] || ''; });
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // ---- Download & Store buttons ------------------------------------------------------------
  // Only shown once config.js has their links: before launch the page offers one thing to do,
  // the waitlist, rather than buttons that don't work yet.

  function wireGetLinks(selector, url, newTab) {
    $$(selector).forEach(link => {
      if (!url) { link.hidden = true; link.style.display = 'none'; return; }
      link.href = url;
      if (newTab) { link.target = '_blank'; link.rel = 'noopener'; }
    });
  }
  wireGetLinks('[data-download]', CONFIG.downloadUrl, false);
  wireGetLinks('[data-store]', CONFIG.storeUrl, true);

  const requirements = 'Windows 10 (2004 or newer) and 11';
  const meta = [CONFIG.version && 'Version ' + CONFIG.version, CONFIG.size].filter(Boolean).join(' · ');
  $$('[data-get-note]').forEach(el => {
    el.textContent = LAUNCHED ? ['Free', 'Windows 10 & 11', meta].filter(Boolean).join(' · ') : 'Coming soon for Windows 10 & 11';
  });
  $$('[data-download-meta]').forEach(el => { el.textContent = [meta, requirements].filter(Boolean).join(' · '); });

  if (LAUNCHED) {
    const best = CONFIG.downloadUrl || CONFIG.storeUrl;
    $$('[data-cta]').forEach(a => { a.innerHTML = '<span class="long">Download</span><span class="short">Get</span>'; });
    $$('[data-plan="free"]').forEach(a => { a.textContent = 'Download free'; a.href = best; });
    $$('[data-plan="pro"]').forEach(a => { a.innerHTML = '<span>Get Pro</span>'; a.href = CONFIG.storeUrl || best; });
    $$('[data-plan="ai"]').forEach(a => { a.textContent = 'Get Glyde AI with Pro'; a.href = CONFIG.storeUrl || best; });
  }

  // ---- Radio groups (the songs, the currency) ------------------------------------------------
  // One Tab stop each, on the chosen one; the arrow keys move between them and choose.

  function radioKeys(group, choose) {
    const radios = () => $$('[role="radio"]', group);
    const sync = () => radios().forEach(r => { r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1; });
    group.addEventListener('keydown', e => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const list = radios();
      const at = list.indexOf(document.activeElement);
      if (!step || at < 0) return;
      e.preventDefault();
      const next = list[(at + step + list.length) % list.length];
      choose(next);
      next.focus();
      sync();
    });
    new MutationObserver(sync).observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
    sync();
  }

  // ---- FAQ: answers close the way they opened ----------------------------------------------

  $$('.faq details').forEach(details => {
    const summary = $('summary', details);
    const answer = $('.faq-a', details);
    let closing = 0;
    summary.addEventListener('click', e => {
      if (!details.open || reduceMotion) return;
      e.preventDefault();
      if (closing) return;
      answer.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }],
        { duration: 180, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      closing = setTimeout(() => {
        details.open = false;
        answer.getAnimations().forEach(a => a.cancel());
        closing = 0;
      }, 180);
    });
  });

  // ---- Content shared by several islands ---------------------------------------------------

  const MESSAGES = [
    {
      app: 'Messages', title: 'Priya', letter: 'P', colors: ['#ff9a8b', '#ff5f8f'],
      body: 'Dinner at 8? I found the perfect place 🌅',
      long: 'Dinner at 8? I found the perfect place by the lake, the one with the fairy lights. Booking for four unless you say no 🌅',
    },
    {
      app: 'Calendar', title: 'Design review', letter: '9', colors: ['#7aa2ff', '#7a5cff'],
      body: 'Starts in 10 minutes · Room Skylight',
      long: 'Starts in 10 minutes in Room Skylight. On the agenda: the island glass, the new tabs, and launch-day colours.',
    },
    {
      app: 'Mail', title: 'Arjun', letter: 'A', colors: ['#5cf2b0', '#22a6d6'],
      body: 'The new build is ready to try ✨',
      long: 'The new build is ready to try ✨ Start with the file shelf. Dragging things onto the island is ridiculously satisfying.',
    },
  ];

  const levelScript = (kind, steps) => async ({ show, wait }) => {
    for (const value of steps) {
      show(V.level(kind, value));
      if (!await wait(330)) return;
    }
    await wait(1500);
  };

  const siroScript = (heard, reply, effect) => async ({ show, wait }) => {
    show(V.siroListening(heard));
    if (!await wait(1800)) return;
    show(V.siroThinking(heard));
    if (!await wait(600)) return;
    const text = typeof reply === 'function' ? reply() : reply;
    show(V.siroAnswer(heard, text));
    effect?.();
    await wait(text.length > 42 ? 4400 : 2700);
  };

  const timeNow = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const greet = siroScript('Hey Glyde', 'Hi! Try “next song”, “volume 30” or “open Chrome”.');

  // Hovering an island with music opens it, with tabs for the clipboard and file shelf.
  function expandedView(tab) {
    // (the app's tabs, in its order: what's playing, Agents, Notifications, Clipboard, Shelf, Notes, Focus, Prompter)
    if (tab === 1) return V.agents();
    if (tab === 2) return V.notificationExpanded(MESSAGES[0]);
    if (tab === 3) return V.clipboard();
    if (tab === 4) return V.shelf();
    if (tab === 5) return V.notes();
    if (tab === 6) return V.focus();
    if (tab === 7) return V.prompter();
    return V.mediaExpanded(true);
  }

  // A running timer, counting down in the pill.
  const countdown = (title, from, ms) => async ({ show, wait }) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      show(V.timerCountdown(title, from - (ms - (end - Date.now())) / 1000));
      if (!await wait(250)) return;
    }
  };

  // Clicking a clipboard row "copies" it.
  function flashCopied(button) {
    const when = button.querySelector('.clip-when');
    const before = when.textContent;
    button.classList.add('copied');
    when.textContent = 'Copied';
    setTimeout(() => { button.classList.remove('copied'); when.textContent = before; }, 1200);
  }

  function islandActions(director) {
    director.onAction = (act, button) => {
      if (act.startsWith('clip:')) flashCopied(button);
      else if (act.startsWith('timer-cancel:')) button.closest('.tm-row').classList.add('gone');
      else if (act === 'siro') { director.setHover(false); director.run(greet); }
    };
  }

  // ---- Navigation island ------------------------------------------------------------------------

  const SECTIONS = [
    { id: 'top', label: 'Glyde' },
    { id: 'features', label: 'Features', sub: 'Live activities', icon: 'grid' },
    { id: 'music', label: 'Music', sub: 'Colour that listens', icon: 'note' },
    { id: 'voice', label: 'Hey Glyde', sub: 'Voice assistant', icon: 'mic' },
    { id: 'point', label: 'Point & Ask', sub: 'Ask about your screen', icon: 'cursor' },
    { id: 'browser', label: 'Browser control', sub: 'Coming soon', icon: 'globe' },
    { id: 'privacy', label: 'Privacy', sub: 'Private by design', icon: 'shield' },
    { id: 'pricing', label: 'Pricing', sub: 'Free and Pro', icon: 'tag' },
    { id: 'faq', label: 'FAQ', sub: 'Questions, answered', icon: 'question' },
    { id: 'changelog', label: 'Changelog', sub: 'What’s new', icon: 'sparkle', href: 'changelog.html' },
    { id: 'founder', label: 'Founder’s note', menu: false },
    { id: 'get', label: 'Get Glyde', sub: LAUNCHED ? 'Download it free' : 'Join the waitlist', icon: 'download', cta: true },
  ];
  let currentSection = SECTIONS[0];

  const measure = (() => {
    const ctx = document.createElement('canvas').getContext('2d');
    return text => {
      ctx.font = '600 13px "Segoe UI Variable Text", "Segoe UI", Inter, sans-serif';
      return ctx.measureText(text).width;
    };
  })();

  function scrollProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? Math.min(1, scrollY / max) : 0;
  }

  function navCompact(section) {
    const width = Math.round(measure(section.label) + 82);
    return {
      key: 'nav-' + section.id, shape: [Math.max(140, width), 34, 17], cls: 'v-navc',
      html: '<svg class="ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="ring-bg" cx="10" cy="10" r="8"/><circle class="ring-fg" cx="10" cy="10" r="8" pathLength="100"/></svg>' +
        `<b>${esc(section.label)}</b><span class="ic">${ICON.grid}</span>`,
      apply: el => { if (!scrollDriven) el.querySelector('.ring-fg').style.strokeDashoffset = (100 - scrollProgress() * 100).toFixed(1); },
    };
  }

  function navMenu() {
    const links = SECTIONS.slice(1).filter(s => s.menu !== false).map(s =>
      `<a href="${s.href || '#' + s.id}" class="${s.cta ? 'cta' : ''}${s.id === currentSection.id ? ' here" aria-current="location' : ''}">` +
      `<span class="m-ic">${ICON[s.icon]}</span><span><b>${s.label}</b><small>${s.sub}</small></span></a>`
    ).join('');
    const rows = Math.ceil(SECTIONS.slice(1).filter(s => s.menu !== false).length / 2);
    return { key: 'nav-menu', shape: [420, 26 + rows * 44, 30], cls: 'v-menu', html: links };
  }

  // The menu island acts the page out too: now playing in Music, Glyde listening in the voice section.
  const navVoice = () => ({
    key: 'nav-voice', shape: [196, 34, 17], cls: 'v-navv',
    html: `${faceHTML('calm')}<b>Say “Hey Glyde”</b>`,
  });
  const navIsland = new Island($('#nav-island'), { music: true });
  navIsland.setNeutral(true);
  const nav = new Director(navIsland, {
    base: () => {
      if (scrollY < 140) return V.idle();
      if (currentSection.id === 'music') return V.mediaCompact();
      if (currentSection.id === 'voice' || currentSection.id === 'say-it') return navVoice();
      return navCompact(currentSection);
    },
    expanded: navMenu,
  });
  islandActions(nav);
  navIsland.el.addEventListener('click', e => { if (e.target.closest('a')) nav.setHover(false); });

  // From the keyboard too: Tab onto the island opens the sections (Enter or Space toggles them,
  // Escape closes them), and they close again once focus moves on.
  const navEl = navIsland.el;
  navEl.tabIndex = 0;
  navEl.setAttribute('aria-label', 'Sections');
  navEl.setAttribute('aria-expanded', 'false');
  nav.onHover = on => navEl.setAttribute('aria-expanded', String(on));
  let closedByKey = false; // (Escape hands focus back to the island: that shouldn't open it again)
  navEl.addEventListener('focus', () => {
    if (closedByKey) { closedByKey = false; return; }
    if (navEl.matches(':focus-visible')) nav.setHover(true);
  });
  navEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === navEl) {
      e.preventDefault();
      nav.setHover(!nav.hovered);
    } else if (e.key === 'Escape' && nav.hovered) {
      nav.setHover(false);
      if (document.activeElement !== navEl) { closedByKey = true; navEl.focus(); }
    }
  });
  navEl.addEventListener('focusout', e => { if (nav.hovered && !navEl.contains(e.relatedTarget)) nav.setHover(false); });

  const topbar = $('.topbar');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      currentSection = SECTIONS.find(s => s.id === id) || SECTIONS[0];
      topbar.classList.toggle('on-night', id === 'voice' || id === 'privacy' || id === 'point' || id === 'browser' || id === 'top' || id === 'get');
      navIsland.setNeutral(id !== 'music');
      nav.refresh();
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-section]').forEach(section => sectionObserver.observe(section));

  // ---- Hero ----------------------------------------------------------------------------------

  const heroIsland = new Island($('#hero-island'), { music: true });
  const hero = new Director(heroIsland, { base: () => V.mediaCompact(), expanded: expandedView });
  islandActions(hero);

  const heroScripts = {
    music: async ({ show, wait }) => { player.play(); show(V.mediaExpanded(true)); await wait(4600); },
    notification: async ({ show, wait }) => { show(V.notification(MESSAGES[0])); await wait(4200); },
    volume: levelScript('volume', [36, 48, 60, 68]),
    brightness: levelScript('brightness', [72, 60, 48]),
    bluetooth: async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(3200); },
    battery: async ({ show, wait }) => { show(V.battery(64)); await wait(3000); },
    privacy: async ({ show, wait, island }) => {
      island.setBubble(true, false);
      show(V.privacy('Discord'));
      if (!await wait(2800)) return;
      show(null); // back to the music; the dot stays while the app keeps the mic
      await wait(2600);
    },
    siro: siroScript('Next song', 'Next track.', () => player.next()),
    timer: async ctx => {
      await siroScript('Timer 10 minutes', 'Timer set for 10 minutes.')(ctx);
      if (ctx.alive()) await countdown('10 minute timer', 600, 3600)(ctx);
    },
  };

  // Light up the chip of whatever the island is showing, so it's clear the chips do that.
  const chipFor = name => $(`.try .chip[data-demo="${name}"]`);
  const tagged = name => async ctx => {
    $$('.try .chip.active').forEach(c => c.classList.remove('active'));
    chipFor(name)?.classList.add('active');
    try { await heroScripts[name](ctx); } finally { if (ctx.alive()) chipFor(name)?.classList.remove('active'); }
  };

  hero.autoplay(['notification', 'volume', 'timer', 'bluetooth', 'siro', 'battery', 'privacy', 'brightness'].map(tagged), { gap: 2600, start: 2400 });

  // Taskbar clock
  const updateClocks = () => {
    const now = new Date();
    $$('[data-clock-time]').forEach(el => { el.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); });
    $$('[data-clock-date]').forEach(el => { el.textContent = now.toLocaleDateString(); });
  };
  updateClocks();
  setInterval(updateClocks, 10000);

  // A soft light that follows the pointer across the hero sky.
  const heroEl = $('.hero');
  if (!reduceMotion) {
    let pending = null;
    heroEl.addEventListener('pointermove', e => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        const r = heroEl.getBoundingClientRect();
        heroEl.style.setProperty('--cx', (e.clientX - r.left) + 'px');
        heroEl.style.setProperty('--cy', (e.clientY - r.top) + 'px');
        pending = null;
      });
    });
  }

  // ---- Music colours ----------------------------------------------------------------------------

  const musicSection = $('#music');
  const musicDirector = new Director(new Island($('#music-island'), { music: true }), { base: () => V.mediaExpanded(false) });
  const albums = $('.albums');
  albums.innerHTML = TRACKS.map((t, i) =>
    `<button class="album" role="radio" aria-checked="false" data-i="${i}" aria-label="${esc(t.title)} by ${esc(t.artist)}">${artHTML(t, 'xl')}<span>${esc(t.title)}</span></button>`
  ).join('');
  albums.addEventListener('click', e => {
    const button = e.target.closest('.album');
    if (!button) return;
    player.select(Number(button.dataset.i));
    player.play();
  });

  function paintMusicSection() {
    const t = player.track;
    $$('.album', albums).forEach((b, i) => b.setAttribute('aria-checked', String(i === player.index)));
    const [a, b, c] = t.colors;
    musicSection.style.setProperty('--m1', a);
    musicSection.style.setProperty('--m2', b);
    musicSection.style.setProperty('--m3', c);
    $('[data-now-playing]').textContent = `${t.title}, ${t.artist}`;
  }
  player.on(type => { if (type !== 'tick') paintMusicSection(); });
  paintMusicSection();
  radioKeys(albums, button => { player.select(Number(button.dataset.i)); player.play(); });

  $('#match-colors').addEventListener('change', e => {
    player.setMatchColors(e.target.checked);
    musicSection.classList.toggle('neutral', !e.target.checked);
  });

  // ---- Glyde ------------------------------------------------------------------------------------

  const siroIsland = new Island($('#siro-island'));
  const siro = new Director(siroIsland, { base: () => V.idle() });
  const SAY = {
    next: ['Next song', 'Next track.', () => player.next()],
    volume: ['Volume 30', 'Volume 30%.'],
    timer: ['Timer 10 minutes', 'Timer set for 10 minutes.'],
    remind: ['Remind me at 5 to call Mom', 'OK, I’ll remind you at 5:00 PM: call Mom.'],
    open: ['Open Chrome', 'Opening Google Chrome.'],
    time: ['What time is it?', () => `It's ${timeNow()}.`],
    help: ['What can you do?', 'I can set timers, alarms and reminders, play, pause and skip music, change the volume and brightness, open apps, tell the time, and lock your PC.'],
  };
  const sayButton = name => $(`.say[data-say="${name}"]`);
  const sayScript = name => async ctx => {
    $$('.say[data-say].active').forEach(b => b.classList.remove('active'));
    sayButton(name)?.classList.add('active');
    try { await siroScript(...SAY[name])(ctx); } finally { if (ctx.alive()) sayButton(name)?.classList.remove('active'); }
  };
  $$('.say[data-say]').forEach(button => button.addEventListener('click', () => {
    stopMic(false);
    hold(siro, 9000);
    siro.run(sayScript(button.dataset.say));
  }));
  siro.autoplay(Object.keys(SAY).filter(k => k !== 'help').map(sayScript), { gap: 1800, start: 900 });

  // ---- Glyde's brain: drafts, answers, copied text ------------------------------------------

  const brainIsland = new Island($('#brain-island'));
  const brain = new Director(brainIsland, { base: () => V.idle() });

  const drafted = (heard, draft, opened) => async ({ show, wait, director }) => {
    show(V.siroListening(heard));
    if (!await wait(1900)) return;
    show(V.siroThinking(heard));
    if (!await wait(900)) return;
    director.opened = opened;
    show(V.siroDraft(draft));
    await wait(7000);
  };
  const answered = (heard, reply) => async ({ show, wait }) => {
    show(V.siroListening(heard));
    if (!await wait(1800)) return;
    show(V.siroThinking(heard));
    if (!await wait(900)) return;
    show(V.siroAnswer(heard, reply));
    await wait(reply.length > 60 ? 4800 : 3200);
  };

  const ASK = {
    email: drafted('Mail Rahul that the meeting moved to 4', {
      icon: 'mail', title: 'Email to Rahul', subject: 'Meeting moved to 4 PM',
      body: 'Hi Rahul, quick heads-up: today’s meeting has moved to 4 PM, same room. See you then!', open: 'Open in Gmail',
    }, 'Opened in Gmail. You press Send.'),
    whatsapp: drafted('WhatsApp Mom that I’ll be late', {
      icon: 'chat', title: 'WhatsApp to Mom',
      body: 'Hi Mom, I’ll be a little late tonight. Don’t wait for me for dinner 🙂', open: 'Open WhatsApp',
    }, 'Opened WhatsApp. You press Send.'),
    translate: answered('Translate this to French', 'Translated to French. It’s copied.'),
    question: answered('What’s the capital of Peru?', 'The capital of Peru is Lima.'),
  };
  const askButton = name => $(`.say[data-ask="${name}"]`);
  const askScript = name => async ctx => {
    $$('.say[data-ask].active').forEach(b => b.classList.remove('active'));
    askButton(name)?.classList.add('active');
    try { await ASK[name](ctx); } finally { if (ctx.alive()) askButton(name)?.classList.remove('active'); }
  };
  $$('.say[data-ask]').forEach(button => button.addEventListener('click', () => {
    hold(brain, 12000);
    brain.run(askScript(button.dataset.ask));
  }));
  brain.onAction = act => {
    if (act === 'draft-cancel') { hold(brain, 5000); brain.stop(); }
    if (act === 'draft-open') {
      hold(brain, 8000);
      const reply = brain.opened || 'Opened.';
      brain.run(async ({ show, wait }) => { show(V.siroAnswer('Yes', reply)); await wait(3000); });
    }
  };
  brain.autoplay(Object.keys(ASK).map(askScript), { gap: 1600, start: 1200 });

  // The glow behind the island breathes with the voice while Glyde listens.
  const siroGlow = $('.siro-glow');
  if (!reduceMotion) {
    let smooth = 0;
    const breathe = now => {
      if (siro.visible) {
        const listening = siroIsland.current && siroIsland.current.key === 'siro-listen';
        smooth += ((listening ? voice.level(now / 1000) : 0) - smooth) * 0.2;
        siroGlow.style.setProperty('--lvl', smooth.toFixed(3));
      }
      requestAnimationFrame(breathe);
    };
    requestAnimationFrame(breathe);
  }

  // The real shortcut works here too.
  const keys = $('.keys');
  function summonGlyde() {
    keys.classList.add('pressed');
    setTimeout(() => keys.classList.remove('pressed'), 180);
    const director = siro.visible ? siro : nav;
    hold(director, 8000);
    director.setHover(false);
    director.run(greet);
  }
  keys.addEventListener('click', summonGlyde);
  keys.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); summonGlyde(); } });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && e.code === 'KeyS') { e.preventDefault(); summonGlyde(); }
  });

  // Stars over the night sky, twinkling (and the aurora drifting) only while it's on screen.
  const stars = $('.stars');
  const night = $('.night');
  new IntersectionObserver(entries => { night.classList.toggle('away', !entries[entries.length - 1].isIntersecting); }).observe(night);
  // Stars, drawn once into a small picture that tiles (cheap to show, however tall the night is): two layers that
  // twinkle in turn.
  const starTile = (n, size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const r = Math.random() * .8 + .5, a = .55 + Math.random() * .45;
      const x = Math.random() * size, y = Math.random() * size;
      const glow = g.createRadialGradient(x, y, 0, x, y, r * 3);
      glow.addColorStop(0, `rgba(255,255,255,${a})`); glow.addColorStop(.35, `rgba(255,255,255,${a * .6})`); glow.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = glow; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
    return c.toDataURL('image/png');
  };
  stars.innerHTML = `<i class="star-layer a" style="background-image:url(${starTile(22, 720)})"></i><i class="star-layer b" style="background-image:url(${starTile(20, 640)})"></i>`;

  // ---- Final call ----------------------------------------------------------------------------

  const finale = new Director(new Island($('#final-island'), { music: true }), { base: () => V.mediaCompact() });
  finale.autoplay([
    async ({ show, wait }) => { show(V.bluetooth('Aurora Buds Pro', 80)); await wait(2800); },
    async ({ show, wait }) => { show(V.notification(MESSAGES[2])); await wait(3600); },
    async ({ show, wait }) => { show(V.battery(100, 'full')); await wait(2600); },
  ], { gap: 2200, start: 800 });

  // ---- Quotes: real ones only, from config.js (the section stays hidden while there are none) ------

  if (Array.isArray(CONFIG.quotes) && CONFIG.quotes.length) {
    const list = $('.quote-list');
    CONFIG.quotes.forEach(q => {
      const card = document.createElement(q.url ? 'a' : 'figure');
      card.className = 'quote reveal in';
      if (q.url) { card.href = q.url; card.target = '_blank'; card.rel = 'noopener'; }
      const text = document.createElement('blockquote');
      text.textContent = q.text;
      const by = document.createElement('figcaption');
      const name = document.createElement('b');
      name.textContent = q.name || '';
      by.append(name);
      if (q.role) { const role = document.createElement('span'); role.textContent = q.role; by.append(role); }
      card.append(text, by);
      list.append(card);
    });
    $('#quotes').hidden = false;
  }

  // ---- Pricing currency ------------------------------------------------------------------------

  function setCurrency(currency, animate = true) {
    $$('.currency button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.cur === currency)));
    $$('.price b, .price-pro[data-usd]').forEach(price => {
      const value = price.dataset[currency];
      if (!animate) { price.textContent = value; return; }
      price.classList.add('swap');
      setTimeout(() => { price.textContent = value; price.classList.remove('swap'); }, 180);
    });
  }
  $$('.currency button').forEach(b => b.addEventListener('click', () => setCurrency(b.dataset.cur)));
  const zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  setCurrency(/Kolkata|Calcutta/.test(zone) ? 'inr' : 'usd', false);
  radioKeys($('.currency'), button => setCurrency(button.dataset.cur));

  // ---- Waitlist ------------------------------------------------------------------------------

  function burst(origin) {
    if (reduceMotion) return;
    const r = origin.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const spark = document.createElement('span');
      const size = 4 + Math.random() * 6;
      spark.style.cssText = `position:fixed;z-index:300;pointer-events:none;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;` +
        `width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#fff8e0,#f2b544 60%,rgba(242,181,68,0));`;
      document.body.appendChild(spark);
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 120;
      spark.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance - 40}px)) scale(.2)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => spark.remove();
    }
  }

  const welcome = {
    app: 'Glyde', title: 'You’re on the list', letter: '✦', colors: ['#ffd88a', '#f2b544'],
    body: 'We’ll email you the moment it’s ready.',
  };

  // Each sign-up goes to the Google Apps Script in config.js (waitlistUrl), which adds a row to
  // your Google Sheet. Sent as a plain form post: Apps Script can't answer a CORS preflight.
  async function saveToWaitlist(form, email) {
    if (!CONFIG.waitlistUrl) {
      console.warn('waitlistUrl is not set in config.js, so this email was not saved anywhere.');
      await sleep(500);
      return {};
    }
    const body = new URLSearchParams({
      email,
      source: form.dataset.source || '',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      lang: navigator.language || '',
      company: $('.hp', form)?.value || '',
    });
    const response = await fetch(CONFIG.waitlistUrl, { method: 'POST', body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw new Error('Waitlist sign-up failed: ' + (result.error || response.status));
    return result;
  }

  $$('[data-waitlist]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('input[type="email"]', form);
    const message = $('.form-msg', form);
    const button = $('button[type="submit"]', form);
    const label = $('span', button);
    const original = label.textContent;
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      message.textContent = 'That email doesn’t look quite right.';
      message.classList.add('error');
      input.focus();
      return;
    }
    message.classList.remove('error');
    message.textContent = '';
    button.disabled = true;
    label.textContent = 'Joining…';
    try {
      const result = await saveToWaitlist(form, email);
      const thanks = result.emailed
        ? 'Thank you! We’ve sent you a welcome email. Check your inbox.'
        : 'Thank you! We’ll email you the day Glyde is ready.';
      $$('[data-waitlist]').forEach(f => {
        f.classList.add('done');
        $('input[type="email"]', f).value = email;
        $('button[type="submit"]', f).disabled = true;
        $('button[type="submit"] span', f).textContent = 'You’re on the list ✓';
        $('.form-msg', f).textContent = thanks;
      });
      burst(button);
      nav.setHover(false);
      nav.run(async ({ show, wait }) => { show(V.notification(welcome)); await wait(4500); });
    } catch (err) {
      console.error(err);
      message.textContent = 'Something went wrong. Please try again in a moment.';
      message.classList.add('error');
      button.disabled = false;
      label.textContent = original;
    }
  }));

  // ---- Fit every island to the room it has ----------------------------------------------------

  function fitIslands() {
    $$('.island-stage[data-max]').forEach(stage => {
      // data-fit: the widest view this island shows (expanded views are 420 wide).
      const room = stage.parentElement.clientWidth;
      const fit = parseFloat(stage.dataset.fit || 440);
      const scale = Math.max(0.5, Math.min(parseFloat(stage.dataset.max), (room - 12) / fit));
      stage.style.setProperty('--s', scale.toFixed(3));
    });
    const navScale = Math.min(1, (innerWidth - 24) / 430);
    $('#nav-island').style.setProperty('--s', navScale.toFixed(3));
  }
  fitIslands();
  addEventListener('resize', fitIslands);

  // ---- Scroll: top bar, hero tilt, progress ring -------------------------------------------------

  const screenWrap = $('.hero .screen-wrap');
  let wasTop = true;
  let lastTilt = -1;
  let scrollQueued = false;
  // Near the top or not (the island shows the time up there): told by an observer when the line is crossed, so
  // nothing reads the scroll position while you scroll.
  const topLine = document.createElement('div');
  topLine.setAttribute('aria-hidden', 'true');
  topLine.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:140px;pointer-events:none;visibility:hidden';
  document.body.prepend(topLine);
  new IntersectionObserver(([entry]) => {
    const atTop = entry.isIntersecting;
    if (atTop !== wasTop) { wasTop = atTop; nav.refresh(); }
  }).observe(topLine);

  // The bar's backdrop, the hero screen's tilt and the island's progress ring follow the scroll from CSS where the
  // browser can (scroll-driven animations, in site.css); elsewhere, here, once a frame.
  function onScroll() {
    scrollQueued = false;
    const y = lastY;
    topbar.classList.toggle('scrolled', y > 20);
    const tilt = reduceMotion ? 0 : Math.max(0, 16 - y / 24);
    if (tilt !== lastTilt) { lastTilt = tilt; screenWrap.style.setProperty('--tilt', tilt.toFixed(2)); }
    const ring = navIsland.currentEl && navIsland.currentEl.querySelector('.ring-fg');
    if (ring) ring.style.strokeDashoffset = (100 - Math.min(1, y / Math.max(1, pageHeight - innerHeight)) * 100).toFixed(1);
  }
  let lastY = scrollY, pageHeight = document.documentElement.scrollHeight;
  if (!scrollDriven) {
    new ResizeObserver(() => { pageHeight = document.documentElement.scrollHeight; }).observe(document.body);
    addEventListener('scroll', () => { lastY = scrollY; if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  } else {
    topbar.classList.add('scrolled'); // (its backdrop then fades in with the scroll, from CSS)
  }

  // ---- Reveal on scroll, card spotlight ------------------------------------------------------

  const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); revealer.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  $$('.reveal').forEach(el => revealer.observe(el));

  $$('.card').forEach(el => {
    let pending = 0;
    el.addEventListener('pointermove', e => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        pending = 0;
      });
    });
  });


  setStill(still, false); // (as left last time)
})();
