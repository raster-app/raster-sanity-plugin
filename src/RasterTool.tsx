import React, { Suspense } from "react";
import { Box } from "@sanity/ui";
import { RasterBrowserFallback } from "./RasterFallback";
import { RasterStudioProvider } from "./RasterStudioProvider";
import { type RasterToolProps } from "./types";

// See `RasterAssetSource` for why this is lazy.
const RasterBrowser = React.lazy(() =>
  import("./RasterBrowser")
    .then((module) => ({ default: module.RasterBrowser }))
    .catch((caught: unknown) => {
      console.error(caught);
      return { default: () => <RasterBrowserFallback label="Raster failed to load." /> };
    })
);

/**
 * Raster as a Studio tool: the same browser, with the whole pane to work in.
 *
 * The tool is also where the redirect sign-in is offered. It owns its own route, so coming
 * back from Raster lands on this URL with nothing else on screen to lose — which is exactly
 * what the asset-source dialog cannot say.
 */
export function RasterTool({ config }: RasterToolProps) {
  return (
    <Box padding={4} style={{ height: "100%", minHeight: 0 }}>
      <RasterStudioProvider config={config}>
        <Suspense fallback={<RasterBrowserFallback />}>
          <RasterBrowser
            config={config}
            allowRedirectSignIn={config.allowRedirectSignIn !== false}
            allowStudioKeySetup
          />
        </Suspense>
      </RasterStudioProvider>
    </Box>
  );
}
