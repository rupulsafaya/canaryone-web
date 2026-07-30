# canaryone-web

Marketing site for [canaryone](https://github.com/rupulsafaya/canaryone) — served at
[canaryone.ai](https://canaryone.ai).

Astro, no Tailwind, no analytics, no web fonts, one page. See
[`SPEC.md`](./SPEC.md) for the decision record.

## Develop

```bash
pnpm install
pnpm dev              # http://localhost:4321
```

## Build

```bash
pnpm build            # static site to ./dist
pnpm preview          # preview the built site
```

The OG image (`public/og.png`) is generated from `public/receipt-kimi-k3.png`
via `scripts/build-og.mjs`. Re-run if you change the receipt.

## Deploy

Vercel, static. Committed to `main` deploys to production. See
[`SPEC.md`](./SPEC.md) for domain + DNS notes.

## License

MIT.
