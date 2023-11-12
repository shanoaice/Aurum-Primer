import daisyui from 'daisyui';
import { type Config } from 'tailwindcss';

const tailwindConfig: Config = {
	content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [daisyui],
	daisyui: {
		themes: true,
	},
};

export default tailwindConfig;
