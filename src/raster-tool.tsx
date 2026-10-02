import { RasterStudioPicker } from './raster-studio-picker'
import type { RasterToolProps } from './types'

/**
 * Raster as a Studio tool: the same picker, with the whole pane to work in, and where an admin
 * saves the studio's API key. There is no field to fill here, so it only browses.
 */
export function RasterTool({ config }: RasterToolProps) {
	return <RasterStudioPicker config={config} allowStudioKeySetup />
}
