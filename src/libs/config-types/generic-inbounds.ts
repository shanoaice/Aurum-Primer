type TunStack = 'system' | 'gvisor' | 'mixed';

type AuthUser = {
	username: string;
	password: string;
};

type TunRules = {
	interface: [include: string[], exclude: string[]]
	uid: [include: number[], exclude: number[]]
	uidRange: [include: string[], exclude: string[]]
}

export function createHttpInbound(
	tag: string,
	port: number,
	listen: string,
	systemProxy = false,
	users?: AuthUser[]
) {
	return {
		type: 'http',
		tag,
		listen_port: port,
		listen,
		set_system_proxy: systemProxy,
		users,
	};
}

export function createSocksInbound(
	tag: string,
	port: number,
	listen: string,
	users?: AuthUser[]
) {
	return {
		type: 'socks',
		tag,
		listen_port: port,
		listen,
		users,
	};
}

export function createMixedInbound(
	tag: string,
	port: number,
	listen: string,
	systemProxy = false,
	users?: AuthUser[]
) {
	return {
		type: 'mixed',
		tag,
		listen_port: port,
		listen,
		set_system_proxy: systemProxy,
		users,
	};
}

export function cerateTunInbound(
	tag: string,
	stack: TunStack,
	interfaceName: string,
	mtu: number,
	tunAddress: [ipv4: string, ipv6?: string],
	strictRoute = false,
	rules?: TunRules
) {
	return {
		type: 'tun',
		tag,
		stack,
		mtu,
		interface_name: interfaceName,
		strict_route: strictRoute,
		rules,
		inet4_address: tunAddress[0],
		inet6_address: tunAddress[1],
	}
}
