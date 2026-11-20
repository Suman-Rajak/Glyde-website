# Glyde website

The landing page for Glyde (formerly WinIsland): plain HTML, CSS and JavaScript, no build step.

```
config.js     links and the waitlist backend: edit this at launch
index.html    the page
site.css      the look: every page's styles in one file (the hero, the island's views, the sections)
pages.css     the reading pages' look (privacy, terms): dark, one column
island.js     the island: shapes, spring animation and views copied from the app (a notch where it hangs from an
              edge, as the app's default; its tabs, Glyde at rest and talking, as the app has them now)
main.js       the page's demos, navigation island, voice demos, waitlist and pricing
dots.js       the app's dot-matrix glyphs and 5x7 dot font (from DotMatrix.cs), drawn as SVG: the plans' marks
smooth.js     smooth wheel scrolling (mouse and touchpad only; off for reduced motion and inside scrolling boxes)
features.js   the feature explorer: every feature, group by group, acted out on one island (agents included)
browser.js    the browser control demo (Glyde AI, coming soon): a drawn browser and Glyde's pointer doing a search
wordmark.js   the hero's "Glyde" wordmark: the light that follows the pointer across it
privacy.html, terms.html   the privacy policy and the terms (have the terms checked before relying on them)
changelog.html  what's new, newest first (add an <article class="release"> at the top for each release)
point.js      the Point & Ask demo: drawn apps, Glyde's marks, pointer, notes and board, in the app's own look
glyde/        Glyde's pictures (calm, blinking, happy, thinking, speaking, and its marks), the app's own
logo.png      the app's logo (the ghost on its violet tile), for the top bar and the dock
favicon.png, apple-touch-icon.png   the tab's and a phone's icon, from the same logo
og-image.jpg  the picture shown when the link is shared (1200 × 630)
robots.txt, sitemap.xml   for search engines; they use the site's address, https://suman-rajak.github.io/Glyde-website/
apps-script/   the Google Sheets waitlist backend (Code.gs) and its setup guide
```

## Run it

From this folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly also works, but the "try the waveform with your voice" button needs `localhost` or `https`.)

## Settings: `config.js`

Everything you'd change at launch is in [`config.js`](config.js):

- **`downloadUrl`** and **`storeUrl`**: while both are empty the site is in "coming soon" mode. The Download and Microsoft Store buttons show a *Soon* tag and lead to the waitlist. Fill in either one and every button on the page goes live, and the waitlist forms are hidden.
- **`version`** and **`size`**: shown under the download button.
- **`quotes`**: real quotes from people who use Glyde. The quotes section stays hidden while the list is empty.
- **`waitlistUrl`**: the Google Apps Script that saves sign-ups to a Google Sheet. Setup takes about 5 minutes; see [`apps-script/README.md`](apps-script/README.md). Until it's set, the forms say thank you but **save the email nowhere**.

Prices are in `index.html` (`data-usd` / `data-inr` on each price and "with Glyde Pro" line), matching the app's `GlydePro.cs`. INR is shown by default to visitors in India.

## Deploy

Any static host works: GitHub Pages, Netlify, Cloudflare Pages or Vercel. The site is the root of this repo, so there's nothing to configure.

## License

Copyright © 2026 Suman Rajak. All rights reserved; see [LICENSE](LICENSE). The code is public so the site can be hosted, not for reuse.

## Moving to your own domain

The site's address is written in `index.html`, `changelog.html`, `privacy.html` and `terms.html` (the canonical and sharing tags), `robots.txt` and `sitemap.xml`. Replace `https://suman-rajak.github.io/Glyde-website/` with the new address in those files.
