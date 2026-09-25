import { useCallback, useEffect, useRef, useState } from "react";
import { useRasterClient } from "@raster/react";
import { toUserMessage, type PkcePending } from "@raster/sdk";

export type PkceRedirect = {
  /** Where Raster is told to come back to. Null when the flow is unavailable here. */
  redirectUri: string | null;
  /** True while the code is being exchanged, right after the redirect lands. */
  isCompleting: boolean;
  error: string | null;
  /** Hand off to Raster: remember the verifier, then leave the page. */
  start: (authorizationUrl: string, pending: PkcePending) => void;
};

/**
 * The redirect half of the PKCE flow, which only the host can do: the SDK can build the
 * authorization URL and exchange the code, but only Studio knows where `pending` can survive
 * a navigation and which URL Raster may come back to.
 *
 * Offered in the Raster tool and never in the asset-source dialog — a redirect unmounts the
 * document being edited, and losing unsaved changes to sign in is not a trade worth offering.
 *
 * `pending` carries the PKCE verifier, so it is secret: `sessionStorage`, which dies with the
 * tab and is not shared with others, and deleted the moment the exchange returns.
 */
export function usePkceRedirect(options: { enabled: boolean; storagePrefix: string }): PkceRedirect {
  const { enabled, storagePrefix } = options;
  const pendingKey = `${storagePrefix}.pkce.pending`;

  // The client directly rather than `useSignIn`: that hook keeps the outcome on its own state,
  // and the panel below holds a different instance of it, so a failure reported there would
  // never reach this screen.
  const client = useRasterClient();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A React 18+ Studio mounts effects twice in development; exchanging the same code twice
  // fails the second attempt, and the failure would be what the user sees.
  const resumed = useRef(false);

  const redirectUri =
    enabled && typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : null;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || resumed.current) return;

    const params = new URLSearchParams(window.location.search);
    const hasResult = params.has("code") || params.has("error");
    if (!hasResult) return;

    // Reading `sessionStorage` throws outright in a Safari private window and wherever site
    // data is blocked, which must not take down the tool that is merely being opened.
    let raw: string | null = null;
    try {
      raw = window.sessionStorage.getItem(pendingKey);
    } catch {
      raw = null;
    }
    // Someone else's `?code=`, or a tab that never started the flow. Leave the URL alone:
    // it is not ours to clean up.
    if (raw === null) return;

    resumed.current = true;
    setIsCompleting(true);

    const finish = () => {
      window.sessionStorage.removeItem(pendingKey);
      // Strip the code and state so a reload cannot replay them, keeping the tool's own path.
      window.history.replaceState(null, "", window.location.pathname);
      setIsCompleting(false);
    };

    const denied = params.get("error");
    if (denied !== null) {
      setError(params.get("error_description") ?? `Raster refused the sign-in (${denied}).`);
      finish();
      return;
    }

    void (async () => {
      try {
        await client.auth.completePkceSignIn({
          pending: JSON.parse(raw) as PkcePending,
          callbackUrl: window.location.href,
        });
      } catch (caught) {
        console.error(caught);
        setError(toUserMessage(caught));
      } finally {
        finish();
      }
    })();
  }, [enabled, pendingKey, client]);

  const start = useCallback(
    (authorizationUrl: string, pending: PkcePending) => {
      try {
        window.sessionStorage.setItem(pendingKey, JSON.stringify(pending));
      } catch (caught) {
        console.error(caught);
        // Blocked storage would mean coming back with no verifier to finish the exchange, so
        // this is a real failure rather than a lost convenience: say so instead of leaving.
        setError("This browser would not let the plugin remember the sign-in. Try the code flow.");
        return;
      }
      window.location.assign(authorizationUrl);
    },
    [pendingKey]
  );

  return { redirectUri, isCompleting, error, start };
}
