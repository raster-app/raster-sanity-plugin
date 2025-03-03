import { type AssetSourceComponentProps } from "sanity";
import { RasterConfig } from "./types";
import { ErrorBoundary } from "./ErrorBoundary";
import { Suspense, lazy, useState, useEffect } from "react";

// Lazy load the RasterAssetSource component
const LazyRasterAssetSource = lazy(() =>
  import("./RasterAssetSource").then((module) => ({
    default: module.RasterAssetSource,
  }))
);

interface RasterAssetSourceWrapperProps extends AssetSourceComponentProps {
  config: RasterConfig;
}

export function RasterAssetSourceWrapper(props: RasterAssetSourceWrapperProps) {
  const [hasError, setHasError] = useState(false);

  // Check if we're running in React 19
  useEffect(() => {
    const checkReactVersion = async () => {
      try {
        // Dynamic import React to get the version
        const React = await import("react");
        const reactVersion = parseInt(React.version.split(".")[0], 10);

        if (reactVersion >= 19) {
          // We're in React 19, check if the toolkit is compatible
          try {
            // Try to import the toolkit
            await import("@raster-app/raster-toolkit");
          } catch (e) {
            console.error("Error loading Raster toolkit in React 19:", e);
            setHasError(true);
          }
        }
      } catch (e) {
        // If this fails, we're probably in a browser environment
        console.error("Error checking React version:", e);
      }
    };

    checkReactVersion();
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Error loading Raster</h2>
        <p>
          There was an error loading the Raster asset source. This might be due
          to compatibility issues with React 19.
        </p>
        <p>Please contact Raster support for assistance.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: "20px" }}>
          <h2>Error loading Raster</h2>
          <p>
            There was an error loading the Raster asset source. This might be
            due to compatibility issues with React 19.
          </p>
          <p>Please contact Raster support for assistance.</p>
        </div>
      }
    >
      <Suspense fallback={<div>Loading Raster...</div>}>
        <LazyRasterAssetSource {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
