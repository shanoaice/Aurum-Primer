import { For, lazy, Show } from 'solid-js';
import { Navigate, Route, Routes, useMatch } from '@solidjs/router';
import Navbar from '~/components/Navbar';
import AppRoutes from '~/constants/Routes';
import { currentTheme, daemonConfig } from '~/signals/persisted';

const Dashboard = lazy(async () => import('~/pages/Dashboard'));
const Setup = lazy(async () => import('~/pages/Setup'));

const routes = [
	{
		path: AppRoutes.Dashboard,
		component: Dashboard,
	},
	{
		path: AppRoutes.Setup,
		component: daemonConfig()
			? () => <Navigate href={AppRoutes.Dashboard} />
			: Setup,
	},
];

function App() {
	const duringSetup = useMatch(() => AppRoutes.Setup);
	return (
		<div data-theme={currentTheme()} class="w-full h-screen">
			<Show when={!duringSetup()}>
				<Navbar />
			</Show>
			<div class="p-4 w-full h-max">
				<Routes>
					<For each={routes}>
						{(route) => <Route path={route.path} component={route.component} />}
					</For>
				</Routes>
			</div>
		</div>
	);
}

export default App;
