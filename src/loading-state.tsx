import { Flex, Spinner, Text } from '@sanity/ui'

/**
 * A spinner with a label. The label is what a screen reader announces; a spinner alone says
 * nothing.
 */
export function LoadingState({ label }: { label: string }) {
	return (
		<Flex align="center" justify="center" gap={3} padding={5} role="status" aria-live="polite">
			<Spinner />
			<Text size={1} muted>
				{label}
			</Text>
		</Flex>
	)
}
