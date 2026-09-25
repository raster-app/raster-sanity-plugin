import { useState } from 'react'
import { toUserMessage } from '@raster/sdk'
import { Button, Card, Flex, Text, TextInput } from '@sanity/ui'
import { useCurrentUser } from 'sanity'
import { verifyApiKey } from './client'
import { useStudioKey } from './use-studio-key'

/** Lets an administrator save or remove the API key used for everyone in this studio. */
export function StudioKeySetup() {
	/** Context */
	const studioKey = useStudioKey()
	const user = useCurrentUser()

	/** State */
	const [draft, setDraft] = useState('')
	const [status, setStatus] = useState<'idle' | 'saving' | 'removing'>('idle')
	const [error, setError] = useState<string | null>(null)

	/** Derived */
	const isAdmin = user?.roles.some((role) => role.name === 'administrator') === true

	/** Handlers */
	async function handleSave() {
		const apiKey = draft.trim()
		setStatus('saving')
		setError(null)
		try {
			await verifyApiKey(apiKey)
			await studioKey.save(apiKey)
		} catch (caught) {
			console.error(caught)
			setError(toUserMessage(caught))
			setStatus('idle')
		}
	}

	async function handleRemove() {
		setStatus('removing')
		setError(null)
		try {
			await studioKey.remove()
		} catch (caught) {
			console.error(caught)
			setError(toUserMessage(caught))
		} finally {
			setStatus('idle')
		}
	}

	/** Early returns */
	if (!isAdmin || studioKey.key === undefined) return null

	return (
		<Card padding={4} radius={2} border>
			<Flex direction="column" gap={3}>
				<Text size={1} weight="semibold">
					Connect everyone with an API key
				</Text>
				<Text size={1} muted>
					{studioKey.key === null
						? 'Save an organization API key and editors are connected without signing in.'
						: 'A key is saved for this studio. Save another to replace it.'}{' '}
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
						disabled={draft.trim() === '' || status !== 'idle'}
						loading={status === 'saving'}
						onClick={() => void handleSave()}
					/>
					{studioKey.key !== null && (
						<Button
							mode="ghost"
							tone="critical"
							fontSize={1}
							padding={3}
							text="Remove saved key"
							disabled={status !== 'idle'}
							loading={status === 'removing'}
							onClick={() => void handleRemove()}
						/>
					)}
				</Flex>
			</Flex>
		</Card>
	)
}
