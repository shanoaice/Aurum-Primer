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
	'httpupgrade',
	{
		host: string[];
		path: string;
		headers: Record<string, string>;
	},
];

type V2RayTransports =
	| V2RayHttpTranport
	| V2RayWebSocketTranport
	| V2RayQuicTranport
	| V2RayGrpcTranport
	| V2RayHttpUpgradeTranport;

export function createV2RayTransport(transport: V2RayTransports) {
	return {
		type: transport[0],
		...transport[1],
	};
}

type V2RaySecurity =
	| 'none'
	| 'auto'
	| 'zero'
	| 'aes-128-gcm'
	| 'chacha20-poly1305';

type V2RayPacketEncoding = undefined | 'packetaddr' | 'xudp';

export function createV2RayOutbound(
	server: string,
	port: number,
	security: V2RaySecurity,
	uuid: string,
	transport: V2RayTransports,
	legacy = false,
	packetEncoding?: V2RayPacketEncoding
) {
	return {
		server,
		server_port: port,
		security,
		uuid,
		alter_id: legacy ? 1 : 0,
		packet_encoding: packetEncoding,
		transport: createV2RayTransport(transport),
	};
}
