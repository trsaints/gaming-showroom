import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'


export default defineConfig({
								plugins: [react(), tsconfigPaths()],
								build  : {
									target: 'esnext'
								},
								resolve: {
									alias: {
										'@src'     : '/src',
										'@data'    : '/src/data',
										'@views'   : '/src/views',
										'@services': '/src/services',
										'@utils'   : '/src/utils'
									}
								}
							})
