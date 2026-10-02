import { useEffect, useState, type ReactNode } from 'react'
import { toUserMessage, useRasterClient, useSession, type RasterClient } from '@raster-app/react'
import { Box, Card, Flex, Text } from '@sanity/ui'
import { connectStudioKey } from './client'
import { LoadingState } from './loading-state'
import { StudioKeySetup } from './studio-key-setup'
import { useStudioKey } from './use-studio-key'

// The key last tried on each client. A client lasts as long as the page, so signing out reaches
// the sign-in screen instead of reconnecting, while a key an admin just replaced is still tried.
const attemptedKeys = new WeakMap<RasterClient, string>()

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
	const client = useRasterClient()
	const { credentials, isConfigured } = useSession()
	const studioKey = useStudioKey()

	const [configuredKey, setConfiguredKey] = useState<{
		status: 'idle' | 'connecting' | 'failed'
		message?: string
	}>({ status: 'idle' })

	useEffect(() => {
		// `undefined` means the store is still being read, not signed out.
		if (credentials === undefined || isConfigured) return
		const apiKey = studioKey.key
		if (apiKey == null || attemptedKeys.get(client) === apiKey) return

		attemptedKeys.set(client, apiKey)
		setConfiguredKey({ status: 'connecting' })
		connectStudioKey(client, apiKey, orgId).then(
			() => setConfiguredKey({ status: 'idle' }),
			(caught: unknown) => {
				console.error(caught)
				setConfiguredKey({ status: 'failed', message: toUserMessage(caught) })
			}
		)
	}, [client, studioKey.key, credentials, isConfigured, orgId])

	if (configuredKey.status === 'connecting') return <LoadingState label="Connecting to Raster…" />

	const isSignedOut = credentials !== undefined && !isConfigured

	return (
		<Flex direction="column" gap={3} style={{ height: '100%', minHeight: 0 }}>
			{isSignedOut && configuredKey.status === 'failed' && (
				<Card tone="critical" padding={3} radius={2} border>
					<Text size={1}>
						The API key saved for this studio was refused: {configuredKey.message}
					</Text>
				</Card>
			)}

			{isSignedOut && allowStudioKeySetup && <StudioKeySetup orgId={orgId} />}

			<Box flex={1} style={{ minHeight: 0 }}>
				{children}
			</Box>
		</Flex>
	)
}
