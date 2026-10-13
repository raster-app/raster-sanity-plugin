# Changelog

## 2.0.0

A rewrite on Raster's drop-in picker, [`@raster-app/react`](https://www.npmjs.com/package/@raster-app/react)
`0.1.0` ([SDK docs](https://raster.app/docs/api/sdk)). The asset source and the Raster tool now
both open the picker, and editors sign in to Raster from inside Studio instead of the Studio
config carrying an API key.

### New

- **Sign in from inside Studio** with the device code flow. The session is remembered per
  browser, and signing out asks Raster to revoke it.
- **An API key for the whole studio.** An administrator can save an organization API key once in
  the Raster tool, and editors are connected without signing in. See
  [An API key for everyone](README.md#an-api-key-for-everyone).
- **The picker**, in both the asset source and the tool: an organization switcher, full-text
  search across an organization or one library, an asset's versions with setting one as the
  default, and uploads by button or drag-and-drop, as a new asset or as a variant.
- **Follows the Studio's light or dark scheme.**
- The picker lists videos and PDFs too. Picking one into an image field says that only images
  can be used, and leaves the picker open.

### Breaking changes

- **Requires Sanity 4.2 or later, React 19 and Node.js 22.12 or later.** Sanity v3 is no longer
  supported; stay on 1.0.14 if you cannot upgrade Studio. Sanity 4.0 and 4.1 ship `@sanity/ui`
  2.x, which the plugin cannot use.
- **`@sanity/ui` is now a peer dependency.** 1.0.14 installed its own copy (`3.0.14`). The plugin
  now uses the Studio's copy (3.x or 4.x), which every supported studio already has through
  `sanity`, so nothing needs installing.
- **`apiKey` is no longer a config option.** It shipped the key in the Studio bundle. A config
  that still passes it logs a warning, and the key is ignored. Editors now sign in with their
  own Raster account, or an administrator saves the key once in the Raster tool.
- **The `RasterImage` type is removed.** Use `Asset` from `@raster-app/react`.
- **`sanity.json` is no longer published.** It was a Sanity v2 config, which Sanity 3 and later
  ignore.

### Migrating from 1.x

- Remove `apiKey` from `rasterPlugin(...)`. To keep editors connected without signing in, open
  the Raster tool as an administrator and save the key there.
- `rasterPlugin({ orgId })` still works, and `orgId` is now optional.
- Documents need no changes. Picked images are still stored as ordinary Sanity image assets.
  They now also carry `originalFilename`, the Raster asset's `description` when an original
  asset has one, and `source: { name: "raster", id, url }` pointing back to the Raster asset.
