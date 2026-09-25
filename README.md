# Sanity Plugin - Raster

A Sanity Studio plugin for [Raster](https://raster.app), a digital asset management platform.
Browse your Raster organizations, libraries and variants from inside Studio, and pick images
straight into any image field.

Built on the [Raster Plugin SDK](https://github.com/raster-app/raster-sdk) — the same client,
OAuth flows and image renditions that power Raster's Figma plugin — with every screen drawn in
`@sanity/ui`, so it looks and behaves like the rest of Studio.

## Features

- **Asset source on every image field** — pick an image from Raster without leaving the
  document, and the Raster asset's id and app link are recorded on the Sanity asset.
- **A Raster tool** for browsing libraries on their own, with the whole pane to work in.
- **Sign in from inside Studio** — the device code flow, a redirect sign-in, or an
  organization API key, which an admin can also save once for everyone. No credentials in
  your Studio config.
- **Organization switcher** for a credential that reaches more than one.
- **Full-text search** across an organization, or narrowed to the open library.
- **Variants** — browse an asset's crops and adjustments, and promote one to be the default.
- **Upload** by button or drag-and-drop, as a new asset or as a variant of an existing one.
- **Infinite paging, blurhash placeholders and reserved aspect ratios**, so the grid does not
  reflow as images land.
- **Native Studio UI**, built from `@sanity/ui`, so it follows the Studio's theme and colour
  scheme.

## Installation

```bash
npm install @raster-app/sanity-plugin-raster
# or
pnpm add @raster-app/sanity-plugin-raster
```

## Compatibility

| | Supported |
| --- | --- |
| `sanity` | 4.x, 5.x, 6.x |
| `@sanity/ui` | 3.x, 4.x |
| `react` | 19 |

Upgrading from 1.x, which supported Sanity v3? See the [migration notes](CHANGELOG.md#migrating-from-1x).

`@sanity/ui` is a **peer dependency**, not a dependency — it carries the Studio's theme through
React context, and a second copy means a component that cannot read it. Every studio already has
it by way of `sanity`, so there is nothing to install.

The plugin only uses components exported from the package root in both 3.x and 4.x: `Badge`,
`Box`, `Button`, `Card`, `Dialog`, `Flex`, `Grid`, `Select`, `Spinner`, `Text` and
`TextInput`, laid out with `Flex` and `Grid`'s `gap`, which both versions accept. Some things
are avoided on purpose:

- **`Stack` and `Inline`**, whose spacing prop was renamed `space` → `gap` between 3.0 and 4.0
  with no spelling valid in both. `<Flex direction="column" gap={3}>` does the same job.
- **`MenuButton`, `Menu`, `Breadcrumbs`, `Tooltip`, `Popover` and `Code`**, which 4.x moved
  to subpaths that 3.x does not have. The organization switcher is a `Select`, and the
  breadcrumb is `Flex` with `Button` and `Text`.
- **`@sanity/icons`**, which moved its named icon exports to per-icon subpaths in v5 and left
  `export declare const ImageIcon: never` behind, so the v3/v4 import still typechecks and fails
  at runtime. The eight icons this plugin needs are inlined in `src/icons.tsx`, using @sanity/icons'
  path data under its MIT licence so they still match Studio's own.

## Setup

```typescript
// sanity.config.ts
import { defineConfig } from "sanity";
import { rasterPlugin } from "@raster-app/sanity-plugin-raster";

export default defineConfig({
  // ...other config
  plugins: [rasterPlugin()],
});
```

That is the whole setup. The first time an editor opens the Raster tool or picker they are
asked to connect their Raster account; the session is then remembered in that browser.

### Configuration

Every option is optional.

```typescript
rasterPlugin({
  // Pin the plugin to one organization. The switcher is then hidden.
  organizationId: "acme",

  // What Raster's consent page shows and Connected apps lists. Defaults to "Sanity".
  hostName: "Sanity",

  // Offer the redirect sign-in in the Raster tool alongside the device code. Default true.
  // The picker never offers it: a redirect would unmount the document being edited.
  allowRedirectSignIn: true,

  // Hide the "use an API key instead" path from the sign-in screen. Default false.
  hideApiKeySignIn: false,
});
```

`orgId` from earlier versions still works and means the same thing as `organizationId`.

### An API key for everyone

Instead of having each editor sign in, an administrator can save an organization API key in
the Raster tool: sign out if needed, and use **Connect everyone with an API key** on the
sign-in screen. Editors are then connected without signing in.

The key is stored in the dataset, in a document with the id `secrets.raster`. Sanity only
returns documents with a dot in their id to signed-in users, so it is not public and does not
ship in the Studio bundle. It is not hidden from your team, though:

- **Anyone signed in to the Studio who can read documents can read the key.** Custom roles,
  available on Enterprise plans, can limit that.
- **Dataset exports include it.**

So create the key for this Studio alone, with access to only the libraries it needs.

### Where the session is stored

The credential is kept in `localStorage`, per browser and per Studio workspace, so editors
sign in once rather than on every reload. It also means **any script or plugin running on the
Studio's origin can read the token** — the usual trade for an admin UI, but worth making
deliberately. Signing out clears it and asks Raster to revoke the session, and an editor can
also revoke it in Raster under **Settings > Connected apps**.

## Usage

The plugin adds itself to every `image` field, so no schema changes are needed:

```typescript
// schemas/blogPost.ts
import { defineType } from "sanity";

export default defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    { name: "title", type: "string", validation: (Rule) => Rule.required() },
    { name: "featuredImage", type: "image", title: "Featured Image" },
  ],
});
```

Choosing "Raster" in the field's source menu opens the picker. Sanity fetches the chosen image
and stores it as a normal `sanity.imageAsset`, so everything downstream — hotspot and crop,
the image pipeline, GROQ projections, `next-sanity-image` — works unchanged:

```groq
*[_type == "blogPost"][0]{
  title,
  featuredImage{
    asset->{ url, originalFilename, source }
  }
}
```

`source` carries the provenance: `{ name: "raster", id: "<raster asset id>", url: "<link into
Raster>" }`. That is what gets an editor from an image in a document back to the asset it came
from.

### Promoting a variant

Sanity keeps the file it copied when the image was picked. Promoting a variant in Raster
doesn't change documents; to update one, pick the image again.

## Development

The plugin is built against the [Raster Plugin SDK](https://github.com/raster-app/raster-sdk)
packages: `@raster/sdk` (the REST client, OAuth and image helpers) and `@raster/react`
(provider and hooks). The SDK is headless; everything on screen is this plugin's, in
`@sanity/ui`.

> **While the SDK is unpublished**, the two `@raster/*` dependencies point at a sibling
> checkout with `link:../raster-plugin-sdk/...`, so `pnpm install` expects
> `raster-plugin-sdk` next to this repository with its packages built (`pnpm build` there).
> Replace them with the published ranges before releasing.

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

To try it in a real Studio:

```bash
# In the plugin directory
pnpm link-watch

# In your Sanity studio directory
pnpm yalc add @raster-app/sanity-plugin-raster
pnpm install
```

### How the pieces fit

| File                      | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `src/index.tsx`           | The plugin: the asset source and the tool.                               |
| `src/client.ts`           | One `RasterClient` per Studio workspace, with Studio's host adapters.     |
| `src/RasterStudioProvider.tsx` | The workspace's client, for the `@raster/react` hooks.             |
| `src/RasterSignInGate.tsx` | The three ways in, and the API key saved for the studio.                 |
| `src/sign-in-panel.tsx`   | The sign-in screens: device code, redirect and API key.                  |
| `src/use-studio-key.ts`   | Reads and writes that key in the `secrets.raster` document.              |
| `src/studio-key-setup.tsx` | Where an administrator saves or removes it, in the tool.                |
| `src/RasterBrowser.tsx`   | The organization → library → asset browser, shared by tool and picker.   |
| `src/browser-header.tsx`  | The switcher, breadcrumb, actions and search box.                        |
| `src/library-list.tsx`    | An organization's libraries.                                             |
| `src/asset-grid.tsx`      | The asset grid, with infinite paging and blurhash placeholders.          |
| `src/variant-view.tsx`    | One asset's default and variants, with the detail pane.                  |
| `src/use-browser-actions.ts` | Upload and promote, and the busy, error and notice they report.       |
| `src/AssetDetail.tsx`     | The selected asset's facts and actions.                                  |
| `src/loading-state.tsx`   | A spinner with a label.                                                  |

There is no stylesheet: layout is `Flex`, `Grid` and `Box`, and colour comes from `Card` tones,
so the plugin follows the Studio's theme without a token map.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Open a Pull Request

## License

MIT © Monogram Inc.

## Support

- 📝 [Documentation](https://docs.raster.app)
- 📧 [Email Support](mailto:support@raster.app)

---

<div align="center">
Made with ❤️ by <a href="https://monogram.io">Monogram</a>
</div>
