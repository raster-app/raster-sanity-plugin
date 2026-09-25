import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRasterClient, useSession } from "@raster/react";
import { toUserMessage } from "@raster/sdk";
import { Card, Flex, Text } from "@sanity/ui";
import { LoadingState } from "./loading-state";
import { SignInPanel } from "./sign-in-panel";
import { StudioKeySetup } from "./studio-key-setup";
import { useStudioKey } from "./use-studio-key";

/** Renders its children once there is a credential; a key saved for the studio is used first. */
export function RasterSignInGate({
  allowStudioKeySetup = false,
  children,
}: {
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

  // Each key is tried once per load, so signing out reaches the sign-in screen instead of
  // reconnecting, while a key an admin just replaced is still tried.
  const attemptedKey = useRef<string | null>(null);

  useEffect(() => {
    // `undefined` means the store is still being read, not signed out.
    if (credentials === undefined || isConfigured) return;
    const apiKey = studioKey.key;
    if (apiKey == null || attemptedKey.current === apiKey) return;

    attemptedKey.current = apiKey;
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

  if (credentials === undefined || configuredKey.status === "connecting") {
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

      <SignInPanel />

      {allowStudioKeySetup && <StudioKeySetup />}
    </Flex>
  );
}
