# Sanity Plugin - Raster

A Sanity Studio plugin for [Raster](https://raster.app), a digital asset management platform.
Browse, search and upload Raster assets from Studio, and pick them into any image field.

[![The Raster picker in a Sanity image field](https://rstr.in/raster/changelog/8HCzGrVc8wM-1080)](https://raster.app/docs/integrations/sanity)

**[Read the docs](https://raster.app/docs/integrations/sanity)** for signing in, picking,
browsing, uploads and upgrading from 1.x. Built on
[`@raster-app/react`](https://raster.app/docs/api/sdk).

## Installation

Needs Sanity Studio 4.2 or later, React 19 and Node.js 22.12 or later.

```bash
npm install @raster-app/sanity-plugin-raster
```

```typescript
// sanity.config.ts
import { defineConfig } from "sanity";
import { rasterPlugin } from "@raster-app/sanity-plugin-raster";

export default defineConfig({
  // ...other config
  plugins: [rasterPlugin()],
});
```

Pass `rasterPlugin({ orgId: "acme" })` to pin it to one organization: a sign-in or key for any
other is refused.

## Security

### An API key for everyone

The key an administrator saves under **Connect everyone with an API key** is stored in the
dataset, in the document `secrets.raster` (or `secrets.raster.<orgId>` when pinned), and kept in
memory in editors' browsers, never stored there. Sanity only returns it to signed-in users, but
**anyone who can read documents can read the key, and dataset exports include it**. Create a key
for this Studio alone, with access to only the libraries it needs.

### Where the session is stored

An editor's own sign-in is kept in `localStorage`, so **any script on the Studio's origin can
read it**. Signing out clears it and revokes a signed-in session in Raster.

## Development

```bash
pnpm install
pnpm typecheck
pnpm check
pnpm build
```

[`examples/studio`](examples/studio) is a Studio that loads the plugin from `src/`, with the
manual QA checklist in its README.

To try the built plugin in another Studio, run `pnpm link-watch` here, then in that Studio:

```bash
pnpm yalc add @raster-app/sanity-plugin-raster
pnpm install
```

## License

MIT © Monogram Inc.
