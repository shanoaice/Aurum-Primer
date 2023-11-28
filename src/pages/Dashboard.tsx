import { createMemo, createSignal, onCleanup } from 'solid-js';
import { event } from '@tauri-apps/api';

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

const SizeBreakpoints = {
	kb: 1024,
	mb: 1024 * 1024,
	gb: 1024 * 1024 * 1024,
};

function calcSpeedFromBytes(bytes: number) {
	if (bytes > SizeBreakpoints.gb) {
		return `${(bytes / SizeBreakpoints.gb).toFixed(2)} GB/s`;
	}

	if (bytes > SizeBreakpoints.mb) {
		return `${(bytes / SizeBreakpoints.mb).toFixed(2)} MB/s`;
	}

	if (bytes > SizeBreakpoints.kb) {
		return `${(bytes / SizeBreakpoints.kb).toFixed(2)} KB/s`;
	}

	return `${bytes} B/s`;
}

function calcTotalFromBytes(bytes: number) {
	if (bytes > SizeBreakpoints.gb) {
		return `${(bytes / SizeBreakpoints.gb).toFixed(2)} GB`;
	}

	if (bytes > SizeBreakpoints.mb) {
		return `${(bytes / SizeBreakpoints.mb).toFixed(2)} MB`;
	}

	if (bytes > SizeBreakpoints.kb) {
		return `${(bytes / SizeBreakpoints.kb).toFixed(2)} KB`;
	}

	return `${bytes} B`;
}

function Dashboard() {
	const [daemonStatus, setDaemonStatus] = createSignal<DaemonStatus>({
		memory: 0,
		memoryInuse: 0,
		goroutines: 0,
		connectionsIn: 0,
		connectionsOut: 0,
		trafficAvailable: false,
		uplink: 0,
		downlink: 0,
		uplinkTotal: 0,
		downlinkTotal: 0,
	});
	const downlinkSpeed = createMemo(() =>
		calcSpeedFromBytes(daemonStatus().downlink)
	);
	const uplinkSpeed = createMemo(() =>
		calcSpeedFromBytes(daemonStatus().uplink)
	);
	const downlinkTotal = createMemo(() =>
		calcTotalFromBytes(daemonStatus().downlinkTotal)
	);
	const uplinkTotal = createMemo(() =>
		calcTotalFromBytes(daemonStatus().uplinkTotal)
	);
	const activeConns = createMemo(
		() => daemonStatus().connectionsIn + daemonStatus().connectionsOut
	);
	const memoryUsage = createMemo(() =>
		calcTotalFromBytes(daemonStatus().memoryInuse)
	);

	const downlinkDatasets = createMemo<number[]>((previousDataset) => {
		if (previousDataset.length > 8) {
			previousDataset.shift();
		}

		previousDataset.push(daemonStatus().downlink);
		return previousDataset;
	}, []);

	const uplinkDatasets = createMemo<number[]>((previousDataset) => {
		if (previousDataset.length > 8) {
			previousDataset.shift();
		}

		previousDataset.push(daemonStatus().uplink);
		return previousDataset;
	}, []);

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
		<div class="flex flex-col p-1 gap-0.5">
			<div class="rounded-box shadow-md bg-base-300 stats">
				<div class="stat">
					<div class="stat-title">Upload</div>
					<div class="stat-value">{uplinkSpeed()}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Download</div>
					<div class="stat-value">{downlinkSpeed()}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Upload Total</div>
					<div class="stat-value">{uplinkTotal()}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Download Total</div>
					<div class="stat-value">{downlinkTotal()}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Active Connections</div>
					<div class="stat-value">{activeConns()}</div>
				</div>
				<div class="stat">
					<div class="stat-title">Memory Usage</div>
					<div class="stat-value">{memoryUsage()}</div>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
