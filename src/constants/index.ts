import { type ApexOptions } from 'apexcharts';
import byteSize from 'byte-size';

export const CHART_MAX_XAXIS = 10;

export const DEFAULT_CHART_OPTIONS: ApexOptions = {
	title: { align: 'center', style: { color: 'gray', fontSize: '16px' } },
	chart: {
		toolbar: { show: false },
		zoom: { enabled: false },
		animations: { easing: 'linear' },
	},
	noData: { text: 'Loading...' },
	legend: {
		showForSingleSeries: true,
		fontSize: '16px',
		labels: { colors: 'gray' },
		itemMargin: { horizontal: 32 },
	},
	dataLabels: { enabled: false },
	grid: { yaxis: { lines: { show: false } } },
	stroke: { curve: 'smooth' },
	tooltip: { enabled: false },
	xaxis: {
		labels: { show: false },
		axisTicks: { show: false },
	},
	yaxis: {
		labels: {
			style: { colors: 'gray', fontSize: '13px' },
			formatter: (val) => byteSize(val).toString(),
		},
	},
};