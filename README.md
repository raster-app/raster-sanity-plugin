# Sanity Plugin - Raster

A Sanity Studio plugin for [Raster](https://raster.app), a digital asset management platform.
Browse your Raster organizations, libraries and variants from inside Studio, and pick images
straight into any image field.

Built on [`@raster-app/react`](https://www.npmjs.com/package/@raster-app/react), Raster's
drop-in asset picker: the same sign-in, browsing and uploads as Raster's other plugins, drawn as
Raster draws them.

## Features

- **Asset source on every image field** — pick an image from Raster without leaving the
  document, and the Raster asset's id and app link are recorded on the Sanity asset.
- **A Raster tool** for browsing libraries on their own, with the whole pane to work in.
  Picking an asset there copies its URL.
- **Sign in from inside Studio** with the device code flow, or connect everyone with an
  organization API key an admin saves once. No credentials in your Studio config.
- **Organization switcher** for a credential that reaches more than one.
- **Full-text search** across an organization, or narrowed to the open library.
- **Versions** — browse an asset's variants, and set one as the default.
- **Upload** by button or drag-and-drop, as a new asset or as a variant of an existing one.
- **Follows the Studio's light or dark scheme.**

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

The plugin only uses what the package root exports in both 3.x and 4.x: `Box`, `Button`,
`Card`, `Dialog`, `Flex`, `Spinner`, `Text` and `TextInput`, laid out with `Flex`'s `gap`, which
both versions accept. Some things are avoided on purpose:

- **`Stack` and `Inline`**, whose spacing prop was renamed `space` → `gap` between 3.0 and 4.0
  with no spelling valid in both. `<Flex direction="column" gap={3}>` does the same job.
- **`MenuButton`, `Menu`, `Breadcrumbs`, `Tooltip`, `Popover`, `Code` and `useToast`**, which
  4.x moved to subpaths that 3.x does not have.

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

The only option is optional:

```typescript
rasterPlugin({
  // Pin the plugin to one organization: a sign-in that grants any other fails.
  orgId: "acme",
});
```

A pinned plugin keeps its sign-ins apart from an unpinned one, so pinning it, or changing the
pin, asks editors to sign in again. Editors can't connect an API key of their own while it is
pinned.

### An API key for everyone

Instead of having each editor sign in, an administrator can save an organization API key in
the Raster tool: sign out if needed, and use **Connect everyone with an API key** on the
sign-in screen. Editors are then connected without signing in. The key is read on every load
and kept in memory rather than in editors' browsers, so a rotated key takes effect on the next
load.

The key is stored in the dataset, in a document with the id `secrets.raster`. Sanity only
returns documents with a dot in their id to signed-in users, so it is not public and does not
ship in the Studio bundle. It is not hidden from your team, though:

- **Anyone signed in to the Studio who can read documents can read the key.** Custom roles,
  available on Enterprise plans, can limit that.
- **Dataset exports include it.**

So create the key for this Studio alone, with access to only the libraries it needs. With
`orgId` set, create it in that organization: the plugin uses whichever organization a saved key
belongs to.

### Where the session is stored

The credential is kept in `localStorage`, per browser, Studio workspace and pinned
organization, so editors sign in once rather than on every reload. It also means **any script
or plugin running on the Studio's origin can read the token** — the usual trade for an admin UI,
but worth making deliberately. Signing out clears it and asks Raster to revoke the session, and an editor can
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

The picker lists every asset in a library, videos and PDFs included. Picking one of those into
an image field says that only images can be used, and leaves the picker open.

### Setting a default version

Sanity keeps the file it copied when the image was picked. Setting another version as the
default in Raster doesn't change documents; to update one, pick the image again.

## Development

The plugin is built on [`@raster-app/react`](https://www.npmjs.com/package/@raster-app/react),
which carries the SDK's client, its hooks and `RasterPicker`. What the plugin adds is Sanity's
side: the asset source, the tool, the key saved for the studio, and the picker's stylesheet.

```bash
pnpm install
pnpm typecheck
pnpm check   # Biome: format and lint, applying safe fixes
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

| File                             | What it does                                                         |
| -------------------------------- | -------------------------------------------------------------------- |
| `src/index.tsx`                  | The plugin: the asset source and the tool.                           |
| `src/raster-asset-source.tsx`    | The picker in a dialog, handing Sanity the picked image.             |
| `src/raster-tool.tsx`            | The picker in a pane, where picking copies the asset's URL.          |
| `src/raster-studio-picker.tsx`   | `RasterPicker` with its stylesheet and the Studio's color scheme.    |
| `src/raster-studio-provider.tsx` | The workspace's client, for `RasterPicker`.                          |
| `src/client.ts`                  | One `RasterClient` per Studio workspace and pinned organization.     |
| `src/raster-sign-in-gate.tsx`    | Connects with the studio key before the picker offers to sign in.    |
| `src/use-studio-key.ts`          | Reads and writes that key in the `secrets.raster` document.          |
| `src/studio-key-setup.tsx`       | Where an administrator saves or removes it, in the tool.             |
| `src/loading-state.tsx`          | A spinner with a label.                                              |

The picker's stylesheet, `@raster-app/react/styles.css`, is inlined into the build and added to
the page the first time the picker renders, since a Studio can't be asked to import a plugin's
CSS. Its rules are scoped under `.rs`.

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
