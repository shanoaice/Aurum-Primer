type V2RayHttpTranport = [
	'http',
	{
		host: string[];
		path: string;
		method: string;
		headers: Record<string, string>;
		idle_timeout: string;
		ping_timeout: string;
	},
];

type V2RayWebSocketTranport = [
	'ws',
	{
		path: string;
		headers: Record<string, string>;
		max_early_data: number;
		early_data_header_name: string;
	},
];

type V2RayQuicTranport = ['quic'];

type V2RayGrpcTranport = [
	'grpc',
	{
		service_name: string;
		idle_timeout: string;
		ping_timeout: string;
		permit_without_stream: boolean;
	},
];

type V2RayHttpUpgradeTranport = [
	'http',
	{
		host: string[];
		path: string;
		method: string;
		headers: Record<string, string>;
		idle_timeout: string;
		ping_timeout: string;
	},
];

type V2RayTransportType = 'http' | 'ws' | 'quic' | 'grpc' | 'httpupgrade';
