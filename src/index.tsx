/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import { Router } from '@solidjs/router';
// @ts-expect-error d.ts resolve problem
import { attachDevtoolsOverlay } from '@solid-devtools/overlay';

import './index.css';

import 'solid-devtools';

const root = document.querySelector('#root');

render(
	() => (
		<Router>
			<App />
		</Router>
	),
	root!
);

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
attachDevtoolsOverlay();
