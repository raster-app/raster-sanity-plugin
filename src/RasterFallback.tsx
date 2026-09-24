import { Flex, Text } from "@sanity/ui";

/**
 * What the lazy boundaries show while the browser's chunk arrives.
 *
 * Its own module on purpose: importing it from `RasterBrowser` would make that file a static
 * import of both entry points, and Rollup would then decline to split it out at all — which
 * is the whole reason the browser is loaded lazily.
 */
export function RasterBrowserFallback({ label }: { label?: string }) {
  return (
    <Flex align="center" justify="center" padding={5}>
      <Text size={1} muted>
        {label ?? "Loading Raster…"}
      </Text>
    </Flex>
  );
}
