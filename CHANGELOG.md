# Changelog

## 2.0.0

A rewrite on the [Raster Plugin SDK](https://github.com/raster-app/raster-sdk). Editors can now
sign in to Raster from inside Studio, and the plugin adds a Raster tool alongside the asset source.

### Breaking changes

- **Requires Sanity 4 or later and React 19.** Sanity v3 is no longer supported; stay on 1.0.14
  if you cannot upgrade Studio.
- **`@sanity/ui` is now a peer dependency.** 1.0.14 installed its own copy (`3.0.14`). The plugin
  now uses the Studio's copy (3.x or 4.x), which every studio already has through `sanity`, so
  nothing needs installing.
- **`apiKey` is no longer a config option.** It shipped the key in the Studio bundle. Editors
  now sign in with their own Raster account, or an administrator saves the key once in the
  Raster tool. See [An API key for everyone](README.md#an-api-key-for-everyone).
- **The `RasterImage` type is removed.** Use `Asset` from `@raster/sdk`.

### Migrating from 1.x

- Remove `apiKey` from `rasterPlugin(...)`. To keep editors connected without signing in, open
  the Raster tool as an administrator and save the key there.
- `rasterPlugin({ orgId })` still works, and `orgId` is now optional.
- Documents need no changes. Picked images are still stored as ordinary Sanity image assets, and
  now also carry `source: { name: "raster", id, url }` pointing back to the Raster asset.
