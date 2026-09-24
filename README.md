# Sanity Plugin - Raster

A Sanity Studio plugin for [Raster](https://raster.app), a digital asset management platform.
Browse your Raster organizations, libraries and variants from inside Studio, and pick images
straight into any image field.

Built on the [Raster Plugin SDK](https://github.com/raster-app/raster-sdk) — the same client,
OAuth flows, image renditions and shared components that power Raster's Figma plugin, so the
behaviour matches across hosts while the chrome stays native to Studio.

## Features

- **Asset source on every image field** — pick an image from Raster without leaving the
  document, and the Raster asset's id and app link are recorded on the Sanity asset.
- **A Raster tool** for browsing libraries on their own, with the whole pane to work in.
- **Sign in from inside Studio** — the device code flow, a redirect sign-in, or an
  organization API key. No credentials in your Studio config required.
- **Organization switcher** for a credential that reaches more than one.
- **Full-text search** across an organization, or narrowed to the open library.
- **Variants** — browse an asset's crops and adjustments, and promote one to be the default.
- **Upload** by button or drag-and-drop, as a new asset or as a variant of an existing one.
- **Infinite paging, blurhash placeholders and reserved aspect ratios**, so the grid does not
  reflow as images land.
- **Follows the Studio's colour scheme** by reading Sanity UI's own palette variables.

## Installation

```bash
npm install @raster-app/sanity-plugin-raster
# or
pnpm add @raster-app/sanity-plugin-raster
```

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
  // Connect with an organization API key instead of asking editors to sign in. Convenient,
  // but it ships in the Studio bundle and is readable by anyone who can open the Studio.
  apiKey: process.env.SANITY_STUDIO_RASTER_API_KEY,

  // Pin the plugin to one organization. The switcher is then hidden.
  organizationId: "acme",

  // What Raster's consent page shows and Connected apps lists. Defaults to "Sanity".
  hostName: "Sanity",

  // Offer the redirect sign-in in the Raster tool alongside the device code. Default true.
  // The picker never offers it: a redirect would unmount the document being edited.
  allowRedirectSignIn: true,

  // Hide the "use an API key instead" path from the sign-in screen. Default false.
  hideApiKeySignIn: false,

  // Namespace for the stored session. Set it when one page mounts several studios that
  // should not share a Raster session. Defaults to "raster".
  storageKeyPrefix: "raster",
});
```

`orgId` from earlier versions still works and means the same thing as `organizationId`.

### Where the session is stored

The credential is kept in `localStorage`, per browser and per `storageKeyPrefix`. That means
editors sign in once rather than on every reload, and it also means the bearer token is
readable by any script on the Studio's origin — the usual trade for an admin UI, but worth
making deliberately. Signing out clears it and asks Raster to revoke the session.

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

Raster serves an asset's default image from a stable URL. Promoting a variant replaces the
file behind that URL, so documents already referencing it show the new image without being
edited — Sanity's copy of the file, however, was fetched at pick time and does not change. To
move a published document to a promoted variant, pick the image again.

## Development

The plugin is built against the [Raster Plugin SDK](https://github.com/raster-app/raster-sdk)
packages: `@raster/sdk` (the REST client, OAuth and image helpers), `@raster/react` (provider
and hooks) and `@raster/ui` (the shared grid, switcher and sign-in, themed per host).

> **While the SDK is unpublished**, the three `@raster/*` dependencies point at a sibling
> checkout with `link:../raster-plugin-sdk/...`, so `pnpm install` expects
> `raster-plugin-sdk` next to this repository with its packages built (`pnpm build` there).
> Replace them with the published ranges before releasing — `pnpm prepublishOnly` refuses to
> publish while a `link:` dependency is in place.

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
| `src/client.ts`           | One `RasterClient` per storage namespace, with Studio's host adapters.    |
| `src/RasterStudioProvider.tsx` | The provider, Sanity's Button and Input in the shared components' slots, and the themed root. |
| `src/RasterSignInGate.tsx` | The three ways in, and the configured API key.                           |
| `src/RasterBrowser.tsx`   | The organization → library → asset browser, shared by tool and picker.   |
| `src/AssetDetail.tsx`     | The selected asset's facts and actions.                                  |
| `src/theme/sanity.css`    | The `--raster-*` token contract mapped onto Sanity UI's `--card-*`.      |

Theming is the whole contract: every colour, radius and font in the shared components reads a
`--raster-*` custom property, and `src/theme/sanity.css` reassigns them and nothing else. A
rule that is not a token reassignment belongs in `src/theme/layout.css` — or in the SDK's token
contract, if a component is missing a hook.

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
