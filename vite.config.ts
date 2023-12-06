import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
	base: './',
	resolve: { alias: { '~': '/src' } },
	plugins: [
		devtools({
			autoname: true,
		}),
		solid(),
	],
	build: {
		// Enables top-level await (this requires ES2022)
		target: ['es2022', 'edge89', 'firefox89', 'chrome89', 'safari15'],
	},
});
