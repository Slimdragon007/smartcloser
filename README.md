# SmartCloser

A smart door closer concept demo + waitlist page. Built by [Haslim Engineering](https://github.com/Slimdragon007).

The device (Stage 2) is a WiFi/Bluetooth-enabled assistive device that closes doors automatically, designed for elderly folks who struggle with heavy doors and remote workers who need quiet during calls.

This repo currently contains **Stage 1**: the concept demo + waitlist page. The actual hardware and firmware are Stage 2 and live in branches/folders to be added later.

## Stack

- HTML / CSS / JS (single-file demo page)
- Tailwind CSS via CDN
- Cloudflare Pages (static hosting)
- Cloudflare Pages Functions (serverless API)
- Cloudflare KV (waitlist storage)

## Local development

```bash
npm install
npm run dev
```

Opens `http://localhost:8788` with the page + function running locally. Wrangler emulates KV so form submissions persist between dev sessions in `.wrangler/`.

## Deploy

Deployment is automatic via Cloudflare Pages on push to `main`. The connected Pages project builds from the `web/` directory and the function inside `web/functions/api/` is auto-deployed.

To deploy: `git push origin main`.

## View waitlist signups

```bash
npm run kv:list
```

Shows all keys with the `mail:` prefix. To get a single signup's data:

```bash
npx wrangler kv:key get --binding SMARTCLOSER_WAITLIST "mail:user@example.com"
```

## Project structure

```
smartcloser/
├── web/                       # Cloudflare Pages output directory
│   ├── index.html             # demo page
│   ├── favicon.svg
│   └── robots.txt
├── functions/                 # Cloudflare Pages Functions (project-root sibling)
│   └── api/
│       └── waitlist.js        # POST /api/waitlist
├── docs/superpowers/
│   ├── specs/                 # design specs
│   └── plans/                 # implementation plans
├── wrangler.toml              # Cloudflare config (KV binding)
├── package.json
└── README.md
```

## License

MIT, see `LICENSE`.
