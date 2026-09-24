/**
 * Refuse to publish while a dependency points at a local checkout.
 *
 * The `@raster/*` packages are consumed through `link:../raster-plugin-sdk/...` until they are
 * on npm. A published package.json carrying those would install for nobody, and the failure
 * would land on whoever ran `npm install` rather than on us — so it is caught here instead.
 *
 * Swap the three entries for their published ranges (`^0.1.0`) and this goes quiet.
 */
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const local = Object.entries(manifest.dependencies ?? {}).filter(([, range]) =>
  /^(link|file|workspace):/.test(range)
);

if (local.length > 0) {
  const lines = local.map(([name, range]) => `  ${name}: ${range}`).join("\n");
  console.error(
    `Cannot publish ${manifest.name}@${manifest.version}: these dependencies point at a local checkout.\n${lines}\n\n` +
      "Replace them with the published versions first."
  );
  process.exit(1);
}
