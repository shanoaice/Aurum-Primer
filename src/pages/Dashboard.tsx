import { createSignal, onCleanup } from 'solid-js';
import { event } from '@tauri-apps/api';
import { type UnlistenFn } from '@tauri-apps/api/event';

type DaemonStatus = {
	memory: number;
	memoryInuse: number;
	goroutines: number;
	connectionsIn: number;
	connectionsOut: number;
	trafficAvailable: boolean;
	uplink: number;
	downlink: number;
	uplinkTotal: number;
	downlinkTotal: number;
};

function Dashboard() {
	const [daemonStatus, setDaemonStatus] = createSignal<DaemonStatus>();

	const unsubscribeDaemonStatusPromise = event
		.listen<DaemonStatus>('status', (event) => {
			setDaemonStatus(event.payload);
		})
		.catch((error) => {
			void error;
		});

	onCleanup(() => {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		unsubscribeDaemonStatusPromise.then((unlisten) => {
			if (!unlisten) return;
			unlisten();
		});
	});

	return (
		<>
			<div class="rounded-box shadow-md bg-base-300 m-4 stats">
				<h1>Vite + Solid</h1>
			</div>
		</>
	);
}

export default Dashboard;
