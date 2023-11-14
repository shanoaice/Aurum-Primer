/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';
import { Router } from '@solidjs/router';

const root = document.querySelector('#root');

render(
	() => (
		<Router>
			<App />
		</Router>
	),
	root!
);
