import { createMemo, createSignal, onCleanup } from 'solid-js';
import { merge } from 'lodash';
import byteSize from 'byte-size';
import { event } from '@tauri-apps/api';
import type { ApexOptions } from 'apexcharts';
import { SolidApexCharts } from 'solid-apexcharts';
import { DEFAULT_CHART_OPTIONS } from '~/constants';

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
	const downlinkSpeed = createMemo(
		() => `${byteSize(daemonStatus().downlink).toString()}/s`
	);
	const uplinkSpeed = createMemo(
		() => `${byteSize(daemonStatus().uplink).toString()}/s`
	);
	const downlinkTotal = createMemo(() =>
		byteSize(daemonStatus().downlinkTotal).toString()
	);
	const uplinkTotal = createMemo(() =>
		byteSize(daemonStatus().uplinkTotal).toString()
	);
	const activeConns = createMemo(
		() => daemonStatus().connectionsIn + daemonStatus().connectionsOut
	);
	const memoryUsage = createMemo(() =>
		byteSize(daemonStatus().memoryInuse).toString()
	);

	const downlinkDatasets = createMemo<number[]>((previousDataset) => {
		if (previousDataset.length > 10) {
			previousDataset.shift();
		}

		previousDataset.push(daemonStatus().downlink);
		return previousDataset;
	}, []);

	const uplinkDatasets = createMemo<number[]>((previousDataset) => {
		if (previousDataset.length > 10) {
			previousDataset.shift();
		}

		previousDataset.push(daemonStatus().uplink);
		return previousDataset;
	}, []);

	const memoryDatasets = createMemo<number[]>((previousDataset) => {
		if (previousDataset.length > 10) {
			previousDataset.shift();
		}

		previousDataset.push(daemonStatus().memoryInuse);
		return previousDataset;
	}, []);

	const trafficChartOptions = createMemo<ApexOptions>(() =>
		merge({ title: { text: 'Traffic' } }, DEFAULT_CHART_OPTIONS)
	);

	const trafficChartSeries = createMemo(() => [
		{
			name: 'Download',
			data: downlinkDatasets(),
		},
		{
			name: 'Upload',
			data: uplinkDatasets(),
		},
	]);

	const memoryChartOptions = createMemo<ApexOptions>(() =>
		merge({ title: { text: 'Memory' } }, DEFAULT_CHART_OPTIONS)
	);

	const memoryChartSeries = createMemo(() => [
		{
			name: 'Memory',
			data: memoryDatasets(),
		},
	]);

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
		<div class="flex flex-col p-1 gap-4">
			<div class="rounded-box shadow-md bg-base-300 stats stats-vertical grid-cols-2 lg:stats-horizontal lg:flex">
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
			<div class="flex flex-col lg:flex-row gap-2 rounded-box bg-base-300 p-2">
				<div class="flex-1">
					<SolidApexCharts
						type="area"
						series={trafficChartSeries()}
						options={trafficChartOptions()}
					/>
				</div>
				<div class="flex-1">
					<SolidApexCharts
						type="area"
						series={memoryChartSeries()}
						options={memoryChartOptions()}
					/>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
