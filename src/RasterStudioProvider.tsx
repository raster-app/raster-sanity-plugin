import { type ReactNode } from "react";
import { RasterProvider } from "@raster/react";
import { useWorkspace } from "sanity";
import { getRasterClient } from "./client";
import { type RasterConfig } from "./types";

/**
 * The Raster client for this Studio workspace, for the `@raster/react` hooks below. Everything
 * on screen is drawn with `@sanity/ui`, so it follows the Studio's theme on its own.
 */
export function RasterStudioProvider({
  config,
  children,
}: {
  config: RasterConfig;
  children: ReactNode;
}) {
  const workspace = useWorkspace().name;
  const client = getRasterClient(config, workspace);

  return <RasterProvider client={client}>{children}</RasterProvider>;
}
