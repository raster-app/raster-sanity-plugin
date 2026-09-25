import { type ComponentProps, type ReactNode } from "react";
import { RasterProvider } from "@raster/react";
import {
  RasterComponentsProvider,
  type RasterComponents,
  type SlotButtonProps,
  type SlotInputProps,
} from "@raster/ui";
import { Button, Card, TextInput, useRootTheme } from "@sanity/ui";
import { useWorkspace } from "sanity";
import { getRasterClient } from "./client";
import { useRasterStyles } from "./theme/useRasterStyles";
import { type RasterConfig } from "./types";

/**
 * Sanity's own Button behind `@raster/ui`'s slot.
 *
 * A button is exactly where a plugin stops feeling native, which is why the SDK makes this
 * swappable rather than themable. The variants map onto Sanity's modes: the primary action
 * is a filled default-tone button, a secondary one is `ghost`, and `quiet` — "use an API key
 * instead", "cancel" — is `bleed`.
 */
function SanityButton({ variant = "default", children, ...props }: SlotButtonProps) {
  const mode = variant === "primary" ? "default" : variant === "quiet" ? "bleed" : "ghost";

  return (
    <Button
      {...props}
      mode={mode}
      tone={variant === "primary" ? "primary" : "default"}
      fontSize={1}
      padding={2}
      // Sanity's Button renders its label from `text`, not from children.
      text={children}
    />
  );
}

function SanityInput({ type, ...props }: SlotInputProps) {
  return (
    <TextInput
      {...props}
      // `SlotInputProps` widens `type` to any string; Sanity's is a union of the types it
      // styles. Every type the shared components ask for — search, password, text — is in it.
      type={type as ComponentProps<typeof TextInput>["type"]}
      fontSize={1}
      padding={2}
    />
  );
}

/**
 * Studio's colour scheme, or light if we cannot ask.
 *
 * `useRootTheme` throws when there is no Studio theme above it, which happens for two boring
 * reasons — a preview harness rendering the component on its own, and a studio that ended up
 * with a second copy of `@sanity/ui` — and neither deserves a blank screen. Only the hover
 * overlays read this; every colour that matters comes from `--card-*` on the Card below.
 */
function useStudioScheme(): "light" | "dark" {
  try {
    return useRootTheme().scheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const SANITY_COMPONENTS: Partial<RasterComponents> = {
  Button: SanityButton,
  Input: SanityInput,
};

/**
 * Everything the Raster views need around them: the client, Studio's primitives in place of
 * the shared ones, the stylesheets, and a root that reads Sanity's palette.
 *
 * The `Card` is load-bearing rather than decorative — it is what declares the `--card-*`
 * variables that `theme/sanity.css` maps the tokens onto. Without it the tokens resolve to
 * their neutral defaults and the plugin stops following the Studio's colour scheme.
 */
export function RasterStudioProvider({
  config,
  children,
}: {
  config: RasterConfig;
  children: ReactNode;
}) {
  useRasterStyles();
  const scheme = useStudioScheme();

  const workspace = useWorkspace().name;
  const client = getRasterClient(config, workspace);

  return (
    <RasterProvider client={client}>
      <RasterComponentsProvider components={SANITY_COMPONENTS}>
        <Card height="fill" style={{ height: "100%", minHeight: 0 }}>
          <div
            className="rstr-root"
            data-raster-host="sanity"
            data-raster-scheme={scheme}
            style={{ height: "100%", minHeight: 0 }}
          >
            {children}
          </div>
        </Card>
      </RasterComponentsProvider>
    </RasterProvider>
  );
}
