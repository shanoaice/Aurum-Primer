/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import { Router } from '@solidjs/router';

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
