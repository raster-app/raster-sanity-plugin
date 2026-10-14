import { useEffect, useState, type ReactNode } from 'react'
import { toUserMessage, useRasterClient, useSession, type RasterClient } from '@raster-app/react'
import { Box, Card, Flex, Text } from '@sanity/ui'
import { connectStudioKey } from './client'
import { LoadingState } from './loading-state'
import { StudioKeySetup } from './studio-key-setup'
import { useStudioKey } from './use-studio-key'

// The saved key each client was last signed in under, by connecting it or by an editor signing
// in. A client lasts as long as the page, so after signing out the key stays unused until a
// reload or an admin saves it again, while a key that failed is tried again on the next open.
const signedInUnder = new WeakMap<RasterClient, string>()

// A gate opened while its client is still connecting waits on that connect.
const connecting = new WeakMap<RasterClient, Promise<void>>()

function connectOnce(client: RasterClient, apiKey: string, orgId: string | undefined) {
	const pending =
		connecting.get(client) ??
		connectStudioKey(client, apiKey, orgId).finally(() => connecting.delete(client))
	connecting.set(client, pending)
	return pending
}

/** Connects with the key saved for the studio before the picker offers to sign in. */
export function RasterSignInGate({
	orgId,
	allowStudioKeySetup = false,
	children,
}: {
	orgId: string | undefined
	/** Let an admin save an API key for the studio. The tool only. */
	allowStudioKeySetup?: boolean
	children: ReactNode
}) {
	/** Context */
	const client = useRasterClient()
	const { credentials, isConfigured } = useSession()
	const studioKey = useStudioKey()

	/** State */
	const [configuredKey, setConfiguredKey] = useState<{
		status: 'idle' | 'connecting' | 'failed'
		message?: string
	}>({ status: 'idle' })

	/** Derived */
	const apiKey = studioKey.key
	// Decided while rendering, so the sign-in never shows before the connect starts. Only once
	// the store is read, so an editor's own sign-in from an earlier load is kept.
	const shouldConnect =
		apiKey != null &&
		credentials !== undefined &&
		!isConfigured &&
		configuredKey.status === 'idle' &&
		signedInUnder.get(client) !== apiKey
	const isSignedOut = credentials !== undefined && !isConfigured

	/** Handlers */
	function handleKeyChange() {
		signedInUnder.delete(client)
		// A new object, so an unchanged key renders again too, and connects.
		setConfiguredKey({ status: 'idle' })
	}

	/** Effects */
	useEffect(() => {
		if (isConfigured && apiKey != null) signedInUnder.set(client, apiKey)
	}, [client, apiKey, isConfigured])

	useEffect(() => {
		if (!shouldConnect || apiKey == null) return
		setConfiguredKey({ status: 'connecting' })
		connectOnce(client, apiKey, orgId).then(
			() => setConfiguredKey({ status: 'idle' }),
			(caught: unknown) => {
				console.error(caught)
				setConfiguredKey({ status: 'failed', message: toUserMessage(caught) })
			}
		)
	}, [shouldConnect, client, apiKey, orgId])

	/** Early returns */
	if (shouldConnect || configuredKey.status === 'connecting') {
		return <LoadingState label="Connecting to Raster…" />
	}

	return (
		<Flex direction="column" gap={3} style={{ height: '100%', minHeight: 0 }}>
			{isSignedOut && configuredKey.status === 'failed' && (
				<Card tone="critical" padding={3} radius={2} border>
					<Text size={1}>
						The API key saved for this studio was refused: {configuredKey.message}
					</Text>
				</Card>
			)}

			{isSignedOut && allowStudioKeySetup && (
				<StudioKeySetup orgId={orgId} onChange={handleKeyChange} />
			)}

			<Box flex={1} style={{ minHeight: 0 }}>
				{children}
			</Box>
		</Flex>
	)
}
