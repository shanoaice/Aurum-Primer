import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';
import { asyncStoreApiTauri } from '~/store';
import type Themes from '~/constants/Themes';

export const [currentTheme, setCurrentTheme] = makePersisted(
	// eslint-disable-next-line solid/reactivity
	createSignal<(typeof Themes)[number]>('light'),
	{ name: 'theme', storage: asyncStoreApiTauri }
);

type DaemonConfig = {
	daemonPath: string;
	listenPort: number;
	runOnStart: boolean;
};

export const [daemonConfig, setDaemonConfig] = makePersisted(
	// eslint-disable-next-line solid/reactivity
	createSignal<DaemonConfig | undefined>(),
	{ name: 'daemon_config', storage: asyncStoreApiTauri }
);
