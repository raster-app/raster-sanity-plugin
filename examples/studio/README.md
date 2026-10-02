# Studio example

The plugin in a Sanity Studio, for testing it by hand against Raster.

## Run

1. At the repo root, run `pnpm install`.
2. Here, copy `.env.example` to `.env` and set `SANITY_STUDIO_PROJECT_ID` and
   `SANITY_STUDIO_DATASET` to a Sanity project you can sign in to. Leave
   `SANITY_STUDIO_RASTER_ORG_ID` empty for now.
3. Here, run `pnpm dev` and open http://localhost:3333. Without the two values, the page says
   which to set.

The Studio loads the plugin from `src/`, through the `paths` in `tsconfig.json`, so an edit there
reloads it. **Raster Assets** in the top bar is the tool; a **Post**'s Image field takes an image
from Raster through its Select menu.

## Checklist

Use a test organization with an API key, a library you can write to with images, a video or a
PDF, and an asset with versions. Sign in to the Studio as an administrator. Step 9 queries the
dataset with the Sanity CLI, which needs `pnpm exec sanity login` once.

**Device sign-in**

1. Open Raster Assets, sign in with Raster and grant every organization: the switcher lists them
   all.
2. Sign out, sign in again and narrow the grant to one organization: only it shows. Cancel a
   sign-in: no error. Deny one on the consent page: "The sign-in was denied in the browser."
3. Set `SANITY_STUDIO_RASTER_ORG_ID` to that organization's id and restart: Raster Assets starts
   signed out and asks you to choose that organization. The picker's sign-in has no API key
   field; "Connect everyone with an API key" above it stays. Granting it signs in, showing only
   it.
4. Still pinned, sign out and grant another organization: "That sign-in doesn’t match the Raster
   organization this app uses. Sign in again and choose that organization." Save a key from
   another organization under "Connect everyone with an API key": "That key is for another
   Raster organization than …". Empty the variable and restart: the sign-in from step 2 is still
   there.

**API keys**, unpinned

5. Sign out, and use "Or connect an organization API key": a wrong key reads "That API key was not
   accepted…", and the right one shows its organization. Sign out.
6. Above the sign-in, "Connect everyone with an API key": save a wrong key and it is refused and
   not saved. Save the right one: the picker connects. Reload, and open the Studio in a private
   window: both connect without signing in to Raster.
7. Sign out: the sign-in shows, saying a key is saved, and the key stays unused until a reload.
   Revoke the key in Raster and reload: "The API key saved for this studio was refused: …".
8. Remove saved key, and reload: signed out.

**Picking into an image field**

9. Sign in. On a new Post, choose Image → Select → Raster, open an image and Pick asset: the dialog
   closes and the image fills the field. Then run
   `pnpm exec sanity documents query '*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0]{originalFilename, description, source}'`:
   `source.name` is `raster`, `source.id` is the Raster asset's id, `source.url` opens it in
   Raster, and `description` is there only when the asset has one.
10. Open an asset with versions, choose a variant and Pick asset: the query shows the original's
    id in `source.id`, and `source.url` opens the variant.
11. Pick a video or a PDF: "Only images can be used in this field.", and the picker stays open.

**The tool**

12. Raster Assets fills the pane and only browses: an opened asset has Open in Raster but no
    Pick asset.

**Search, uploads and versions**, in a library you can write to

13. Search runs once typing pauses and shows the count. Picking a hit fills the field as in 9.
14. Upload from the library's menu, then by dropping a file on the grid: its tile shows until
    "Uploaded".
15. Open an asset and Upload variant: the version count goes up. Set as default, then Confirm:
    "Default set". Pick it again: the field takes the new default, and documents holding the old
    one keep it.

**Light and dark**

16. Switch the Studio's appearance between light and dark: the picker follows, in the tool and in
    the dialog. On System, it follows the operating system.

**Session**

17. Reload: still signed in, on the same library.
18. Sign out: Raster's Connected apps drops Sanity Studio. Reload: still signed out.
