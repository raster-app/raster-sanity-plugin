import { rasterPlugin } from '@raster-app/sanity-plugin-raster'
import { defineConfig, defineField, defineType } from 'sanity'
import { structureTool } from 'sanity/structure'

// `import.meta.env`, since a `process.env` variable that no .env sets is a ReferenceError here.
const projectId: string | undefined = import.meta.env.SANITY_STUDIO_PROJECT_ID
const dataset: string | undefined = import.meta.env.SANITY_STUDIO_DATASET
const orgId: string | undefined = import.meta.env.SANITY_STUDIO_RASTER_ORG_ID

if (!projectId || !dataset) {
	throw new Error(
		'Set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET in examples/studio/.env, then restart `pnpm dev`. .env.example describes them.'
	)
}

export default defineConfig({
	projectId,
	dataset,
	plugins: [structureTool(), rasterPlugin({ orgId: orgId || undefined })],
	schema: {
		types: [
			defineType({
				name: 'post',
				title: 'Post',
				type: 'document',
				fields: [
					defineField({ name: 'title', type: 'string' }),
					defineField({ name: 'image', type: 'image' }),
				],
			}),
		],
	},
})
