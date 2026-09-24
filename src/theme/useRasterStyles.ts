import { useEffect } from "react";
import componentStyles from "@raster/ui/styles.css?inline";
import layoutStyles from "./layout.css?inline";
import sanityTheme from "./sanity.css?inline";

const STYLE_ELEMENT_ID = "raster-sanity-plugin-styles";

/**
 * Put the plugin's stylesheets into the Studio document, once.
 *
 * `@raster/ui` ships its CSS as a file, which a Sanity plugin cannot ask the studio to
 * import — so the three sheets are inlined at build time (`?inline` gives us their text) and
 * injected here instead. The order is the contract: component rules, then the token mapping,
 * then this plugin's own chrome.
 *
 * Deliberately never removed. Several mounts share one element — the asset-source dialog and
 * the tool can both be open — and tearing it down on the first unmount would strip the
 * styles from whatever is still on screen. One `<style>` for the life of the page is cheap.
 */
export function useRasterStyles(): void {
  useEffect(() => {
    // Studio extracts schemas in Node, where there is no document to inject into.
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ELEMENT_ID) !== null) return;

    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = [componentStyles, sanityTheme, layoutStyles].join("\n");
    document.head.append(style);
  }, []);
}
