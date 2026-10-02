import { defineCliConfig } from 'sanity/cli'

// The CLI loads .env into `process.env` before reading this file.
export default defineCliConfig({
	api: {
		projectId: process.env.SANITY_STUDIO_PROJECT_ID,
		dataset: process.env.SANITY_STUDIO_DATASET,
	},
})
