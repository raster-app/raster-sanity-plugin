import { useState, type FormEvent } from "react";
import { useSignIn } from "@raster/react";
import { type PkcePending } from "@raster/sdk";
import { Button, Card, Flex, Text, TextInput } from "@sanity/ui";

export type SignInPanelProps = {
  /** Offer the redirect sign-in, handing back what must survive the navigation. */
  pkce?: {
    redirectUri: string;
    onReady: (authorizationUrl: string, pending: PkcePending) => void;
  };
  /** Offer the "use an API key instead" path. */
  allowApiKey: boolean;
};

/**
 * The ways in: the device grant by default, the redirect when the host can come back to this
 * page, and an organization API key. Every path ends at the SDK's `connect`, which checks the
 * credential with Raster before storing it.
 */
export function SignInPanel({ pkce, allowApiKey }: SignInPanelProps) {
  /** Data */
  const { state, signInWithDevice, beginPkceSignIn, connectApiKey, cancel, reset } = useSignIn();

  /** State */
  const [screen, setScreen] = useState<"idle" | "apiKey">("idle");

  /** Derived */
  const busy = state.status === "connecting";
  const error = state.status === "error" ? state.message : null;

  /** Handlers */
  async function handleRedirect() {
    if (pkce === undefined) return;
    const started = await beginPkceSignIn({ redirectUri: pkce.redirectUri });
    // The host owns the navigation: only it knows where `pending` can survive the redirect.
    if (started !== null) pkce.onReady(started.authorizationUrl, started.pending);
  }

  /** Early returns */
  if (state.status === "awaitingApproval") {
    return (
      <Card padding={4} radius={2} border>
        <Flex direction="column" gap={4}>
          <Text size={1}>Confirm this code in the browser tab that just opened:</Text>
          {/* Announced, since it appears without any action of the editor's. */}
          <Text size={4} weight="semibold" aria-live="polite" style={{ letterSpacing: "0.1em" }}>
            {state.device.userCode}
          </Text>
          <Text size={1} muted>
            Waiting for you to approve in Raster. This screen finishes on its own.
          </Text>
          <Flex>
            <Button mode="bleed" fontSize={1} padding={2} text="Cancel" onClick={cancel} />
          </Flex>
        </Flex>
      </Card>
    );
  }

  if (screen === "apiKey") {
    return (
      <ApiKeyForm
        busy={busy}
        error={error}
        onSubmit={connectApiKey}
        onBack={() => {
          reset();
          setScreen("idle");
        }}
      />
    );
  }

  return (
    <Card padding={4} radius={2} border>
      <Flex direction="column" gap={4}>
        <Text size={1}>
          Connect Sanity Studio to Raster to browse your libraries and place images.
        </Text>

        {error !== null && (
          <Card tone="critical" padding={3} radius={2} border>
            <Text size={1}>{error}</Text>
          </Card>
        )}

        <Flex gap={2} wrap="wrap">
          <Button
            mode="default"
            tone="primary"
            fontSize={1}
            padding={3}
            text={busy ? "Connecting…" : "Sign in with Raster"}
            disabled={busy}
            onClick={() => void signInWithDevice()}
          />
          {pkce !== undefined && (
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              text="Sign in in this window"
              disabled={busy}
              onClick={() => void handleRedirect()}
            />
          )}
        </Flex>

        {allowApiKey && (
          <Flex>
            <Button
              mode="bleed"
              fontSize={1}
              padding={2}
              text="Use an API key instead"
              disabled={busy}
              onClick={() => setScreen("apiKey")}
            />
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

function ApiKeyForm({
  busy,
  error,
  onSubmit,
  onBack,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (apiKey: string) => Promise<void>;
  onBack: () => void;
}) {
  /** State */
  const [value, setValue] = useState("");

  /** Handlers */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed !== "") void onSubmit(trimmed);
  }

  return (
    <Card padding={4} radius={2} border>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap={4}>
          <Text size={1} muted>
            Create a key in Raster under Organization settings → API keys. A key reaches one
            organization.
          </Text>
          <TextInput
            type="password"
            fontSize={1}
            padding={3}
            value={value}
            placeholder="Organization API key"
            aria-label="Organization API key"
            autoComplete="off"
            autoFocus
            onChange={(event) => setValue(event.currentTarget.value)}
          />
          {error !== null && (
            <Card tone="critical" padding={3} radius={2} border>
              <Text size={1}>{error}</Text>
            </Card>
          )}
          <Flex gap={2} wrap="wrap">
            <Button
              type="submit"
              mode="default"
              tone="primary"
              fontSize={1}
              padding={3}
              text={busy ? "Checking…" : "Connect"}
              disabled={busy || value.trim() === ""}
            />
            <Button
              mode="ghost"
              fontSize={1}
              padding={3}
              text="Back"
              disabled={busy}
              onClick={onBack}
            />
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}
