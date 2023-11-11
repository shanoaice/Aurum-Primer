export function createDirectOutbound(tag: string, detour: string) {
	return {
		type: 'direct',
		tag,
		detour,
	};
}

export function createBlockOutbound(tag: string) {
	return {
		type: 'block',
		tag,
	};
}

export function createSelectorOutbound(
	tag: string,
	outbounds: string[],
	interruptExistingConnections: boolean
) {
	return {
		type: 'selector',
		tag,
		outbounds,
		interrupt_exist_connections: interruptExistingConnections,
	};
}
