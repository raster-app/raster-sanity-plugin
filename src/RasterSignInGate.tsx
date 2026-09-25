import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRasterClient, useSession } from "@raster/react";
import { toUserMessage } from "@raster/sdk";
import { Card, Flex, Text } from "@sanity/ui";
import { LoadingState } from "./loading-state";
import { SignInPanel } from "./sign-in-panel";
import { StudioKeySetup } from "./studio-key-setup";
import { type RasterConfig } from "./types";
import { useStudioKey } from "./use-studio-key";

/**
 * Nothing below this renders until there is a credential to call Raster with.
 *
 * The ways in, in the order they are offered: an API key an admin saved for the studio
 * (adopted without asking anyone), the device code, and an API key of the editor's own. The
 * tool is also where an admin saves the studio's key. All of them end at the SDK's `connect`, which verifies against `/me` before storing anything, so a bad key is an
 * error on this screen rather than a broken session discovered three clicks later.
 */
export function RasterSignInGate({
  config,
  allowStudioKeySetup = false,
  children,
}: {
  config: RasterConfig;
  /** Let an admin save an API key for the studio. The tool only. */
  allowStudioKeySetup?: boolean;
  children: ReactNode;
}) {
  const client = useRasterClient();
  const { credentials, isConfigured } = useSession();
  const studioKey = useStudioKey();

  const [configuredKey, setConfiguredKey] = useState<{
    status: "idle" | "connecting" | "failed";
    message?: string;
  }>({ status: "idle" });

  // Once per page load, not once per render, and never again after a sign-out: an editor who
  // signs out of a studio with a saved key should reach the sign-in screen rather than
  // be put straight back where they were.
  const attempted = useRef(false);

  useEffect(() => {
    // `undefined` is "still reading the store", which is not the same as signed out.
    if (credentials === undefined || isConfigured) return;
    const apiKey = studioKey.key;
    if (apiKey == null || attempted.current) return;

    attempted.current = true;
    setConfiguredKey({ status: "connecting" });
    client.auth.connect({ apiKey }).then(
      () => setConfiguredKey({ status: "idle" }),
      (caught: unknown) => {
        console.error(caught);
        setConfiguredKey({ status: "failed", message: toUserMessage(caught) });
      }
    );
  }, [client, studioKey.key, credentials, isConfigured]);

  if (isConfigured) return <>{children}</>;

  if (
    credentials === undefined ||
    studioKey.key === undefined ||
    configuredKey.status === "connecting"
  ) {
    return <LoadingState label="Connecting to Raster…" />;
  }

  return (
    <Flex direction="column" gap={4} padding={4}>
      {configuredKey.status === "failed" && (
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>
            The API key saved for this studio was refused: {configuredKey.message}
          </Text>
        </Card>
      )}

      <SignInPanel allowApiKey={config.hideApiKeySignIn !== true} />

      {allowStudioKeySetup && <StudioKeySetup studioKey={studioKey} />}
    </Flex>
  );
}
