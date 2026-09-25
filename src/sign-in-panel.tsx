import { useSignIn } from '@raster/react'
import { Button, Card, Flex, Text } from '@sanity/ui'
import { HOST_NAME } from './client'

/** Sign-in with the device code, which works in the tool and the picker without leaving the page. */
export function SignInPanel() {
	/** Data */
	const { state, signInWithDevice, cancel } = useSignIn()

	/** Derived */
	const busy = state.status === 'connecting'

	/** Early returns */
	if (state.status === 'awaitingApproval') {
		return (
			<Card padding={4} radius={2} border>
				<Flex direction="column" gap={4}>
					<Text size={1}>Confirm this code in the browser tab that just opened:</Text>
					{/* Announced, since it appears without any action of the editor's. */}
					<Text size={4} weight="semibold" aria-live="polite" style={{ letterSpacing: '0.1em' }}>
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
		)
	}

	return (
		<Card padding={4} radius={2} border>
			<Flex direction="column" gap={4}>
				<Text size={1}>
					Connect {HOST_NAME} to Raster to browse your libraries and place images.
				</Text>

				{state.status === 'error' && (
					<Card tone="critical" padding={3} radius={2} border>
						<Text size={1}>{state.message}</Text>
					</Card>
				)}

				<Flex>
					<Button
						mode="default"
						tone="primary"
						fontSize={1}
						padding={3}
						text={busy ? 'Connecting…' : 'Sign in with Raster'}
						disabled={busy}
						onClick={() => void signInWithDevice()}
					/>
				</Flex>
			</Flex>
		</Card>
	)
}
