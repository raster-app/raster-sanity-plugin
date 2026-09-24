import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRasterClient, useSession } from "@raster/react";
import { toUserMessage, type PkcePending } from "@raster/sdk";
import { LoadingScreen, SignInPanel } from "@raster/ui";
import { Card, Stack, Text } from "@sanity/ui";
import { storagePrefix } from "./client";
import { usePkceRedirect } from "./usePkceRedirect";
import { type RasterConfig } from "./types";

/**
 * Nothing below this renders until there is a credential to call Raster with.
 *
 * Three ways in, in the order they are offered: a configured API key (adopted without asking
 * anyone), the device grant, and — in the tool only — the redirect flow. All three end at the
 * SDK's `connect`, which verifies against `/me` before storing anything, so a bad key is an
 * error on this screen rather than a broken session discovered three clicks later.
 */
export function RasterSignInGate({
  config,
  allowRedirectSignIn = false,
  children,
}: {
  config: RasterConfig;
  allowRedirectSignIn?: boolean;
  children: ReactNode;
}) {
  const client = useRasterClient();
  const { credentials, isConfigured } = useSession();
  const pkce = usePkceRedirect({
    enabled: allowRedirectSignIn,
    storagePrefix: storagePrefix(config),
  });

  const [configuredKey, setConfiguredKey] = useState<{
    status: "idle" | "connecting" | "failed";
    message?: string;
  }>({ status: "idle" });

  // Once per page load, not once per render, and never again after a sign-out: an editor who
  // signs out of a studio that configures a key should reach the sign-in screen rather than
  // be put straight back where they were.
  const attempted = useRef(false);

  useEffect(() => {
    // `undefined` is "still reading the store", which is not the same as signed out.
    if (credentials === undefined || isConfigured) return;
    const apiKey = config.apiKey;
    if (apiKey === undefined || apiKey === "" || attempted.current) return;

    attempted.current = true;
    setConfiguredKey({ status: "connecting" });
    client.auth.connect({ apiKey }).then(
      () => setConfiguredKey({ status: "idle" }),
      (caught: unknown) =>
        setConfiguredKey({ status: "failed", message: toUserMessage(caught) })
    );
  }, [client, config.apiKey, credentials, isConfigured]);

  if (isConfigured) return <>{children}</>;

  if (credentials === undefined || configuredKey.status === "connecting" || pkce.isCompleting) {
    return (
      <LoadingScreen
        label={pkce.isCompleting ? "Finishing sign-in…" : "Connecting to Raster…"}
      />
    );
  }

  return (
    <Stack space={4} padding={4}>
      {configuredKey.status === "failed" && (
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>
            The API key configured for this studio was refused: {configuredKey.message}
          </Text>
        </Card>
      )}

      {pkce.error !== null && (
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>{pkce.error}</Text>
        </Card>
      )}

      <SignInPanel
        productName="Sanity Studio"
        allowApiKey={config.hideApiKeySignIn !== true}
        pkce={
          pkce.redirectUri === null
            ? undefined
            : {
                redirectUri: pkce.redirectUri,
                // The panel hands back what must survive the navigation; where it goes and
                // when we leave is the host's call, which is why this is a callback.
                onReady: (authorizationUrl, pending) =>
                  pkce.start(authorizationUrl, pending as PkcePending),
              }
        }
      />
    </Stack>
  );
}
