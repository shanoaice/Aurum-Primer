import { type Store as TauriStore } from 'tauri-plugin-store-api';
import { type AsyncStorageWithOptions } from '@solid-primitives/storage';

type TauriStorageOptions = {
	path: string;
};

export const TauriStoreApi = (
	tauriStore: TauriStore
): AsyncStorageWithOptions<TauriStorageOptions> => ({
	getItem: async (key: string) => tauriStore.get(key),
	getAll: async () => tauriStore.entries(),
	setItem: async (key: string, value: string) => tauriStore.set(key, value),
	removeItem(key) {
		void tauriStore.delete(key);
	},
	clear: async () => tauriStore.clear(),
	// eslint-disable-next-line unicorn/no-await-expression-member
	key: async (index: number) => (await tauriStore.keys())[index],
	length: undefined,
});
