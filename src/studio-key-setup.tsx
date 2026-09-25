import { useState } from "react";
import { useRasterClient, useSession } from "@raster/react";
import { toUserMessage } from "@raster/sdk";
import { Button, Card, Flex, Text, TextInput } from "@sanity/ui";
import { useCurrentUser } from "sanity";
import { type StudioKey } from "./use-studio-key";

/**
 * Where an admin saves an organization API key for everyone using the studio, so editors
 * are connected without signing in. Shown in the Raster tool's sign-in screen, to
 * administrators only; Sanity's permissions still decide whether the save goes through.
 */
export function StudioKeySetup({ studioKey }: { studioKey: StudioKey }) {
  /** Context */
  const client = useRasterClient();
  const { signOut } = useSession();
  const user = useCurrentUser();

  /** State */
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "removing">("idle");
  const [error, setError] = useState<string | null>(null);

  /** Derived */
  const isAdmin = user?.roles.some((role) => role.name === "administrator") === true;

  /** Handlers */
  async function handleSave() {
    const apiKey = draft.trim();
    setStatus("saving");
    setError(null);
    try {
      // Connecting first checks the key against Raster, so a bad one is never saved.
      await client.auth.connect({ apiKey });
    } catch (caught) {
      console.error(caught);
      setError(toUserMessage(caught));
      setStatus("idle");
      return;
    }
    try {
      await studioKey.save(apiKey);
    } catch (caught) {
      // Connected but not saved: leave this browser as it was rather than half set up.
      console.error(caught);
      await signOut();
      setError(`The key works, but Sanity would not save it: ${toUserMessage(caught)}`);
      setStatus("idle");
    }
  }

  async function handleRemove() {
    setStatus("removing");
    setError(null);
    try {
      await studioKey.remove();
    } catch (caught) {
      console.error(caught);
      setError(toUserMessage(caught));
    } finally {
      setStatus("idle");
    }
  }

  /** Early returns */
  if (!isAdmin || studioKey.key === undefined) return null;

  return (
    <Card padding={4} radius={2} border>
      <Flex direction="column" gap={3}>
        <Text size={1} weight="semibold">
          Connect everyone with an API key
        </Text>
        <Text size={1} muted>
          {studioKey.key === null
            ? "Save an organization API key and editors are connected without signing in."
            : "A key is saved for this studio. Save another to replace it."}{" "}
          Anyone signed in to this Studio who can read documents can read the key, and dataset
          exports include it, so use one limited to the libraries the Studio needs.
        </Text>
        <TextInput
          type="password"
          value={draft}
          placeholder="Organization API key"
          onChange={(event) => setDraft(event.currentTarget.value)}
        />
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
            text="Save for everyone"
            disabled={draft.trim() === "" || status !== "idle"}
            loading={status === "saving"}
            onClick={() => void handleSave()}
          />
          {studioKey.key !== null && (
            <Button
              mode="ghost"
              tone="critical"
              fontSize={1}
              padding={3}
              text="Remove saved key"
              disabled={status !== "idle"}
              loading={status === "removing"}
              onClick={() => void handleRemove()}
            />
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
