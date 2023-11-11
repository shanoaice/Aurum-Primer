export type ShadowsocksMethod =
	| '2022-blake3-aes-128-gcm'
	| '2022-blake3-aes-256-gcm'
	| '2022-blake3-chacha20-poly1305'
	| 'aes-128-gcm'
	| 'aes-192-gcm'
	| 'aes-256-gcm'
	| 'chacha20-ietf-poly1305'
	| 'xchacha20-ietf-poly1305'
	| 'none';

export function createShadowsocksOutbound(
	tag: string,
	server: string,
	port: number,
	method: ShadowsocksMethod,
	password: string
) {
	return {
		tag,
		server,
		server_port: port,
		method,
		password,
	};
}
