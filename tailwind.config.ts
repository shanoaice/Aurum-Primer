import daisyui from 'daisyui';
import { type Config } from 'tailwindcss';
import { addDynamicIconSelectors } from '@iconify/tailwind';

const tailwindConfig: Config = {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [daisyui, addDynamicIconSelectors()],
	daisyui: {
		themes: true,
	},
};

export default tailwindConfig;
