import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';
import { asyncStoreApiTauri } from '~/store';

export const [currentTheme, setCurrentTheme] = makePersisted(
	// eslint-disable-next-line solid/reactivity
	createSignal('light'),
	{ name: 'theme', storage: asyncStoreApiTauri }
);
