export const HOST = {
	/** What Raster's consent page, Connected apps and the sign-in screen call this host. */
	name: 'Sanity Studio',
	openExternal: (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer')
	},
}

/**
 * What a workspace's Raster sign-in, browsing state and caches are kept under. The project and
 * dataset are in it so studios sharing an origin, such as several run on localhost:3333, don't
 * share one under the default workspace name.
 */
export function rasterScope(
	workspace: { name: string; projectId: string; dataset: string },
	orgId: string | undefined
): string {
	const scope = `raster.${workspace.projectId}.${workspace.dataset}.${workspace.name}`
	return orgId === undefined ? scope : `${scope}.org.${orgId}`
}
