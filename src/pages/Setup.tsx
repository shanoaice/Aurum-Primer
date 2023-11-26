import { createSignal, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { invoke, dialog, os } from '@tauri-apps/api';
import { setDaemonConfig } from '~/signals/persisted';
import TrivialErrorModal from '~/components/TrivialErrorModal.tsx';
import Routes from '~/constants/Routes.ts';

function randomPort() {
	return Math.floor(Math.random() * 62_535) + 3000;
}

function Setup() {
	const [daemonPath, setDaemonPath] = createSignal('');
	const [daemonPort, setDaemonPort] = createSignal(9090);
	const daemonConfig = createMemo(() => ({
		daemonPath: daemonPath(),
		listenPort: daemonPort(),
		runOnStart: true,
	}));
	const [errorMessage, setErrorMessage] = createSignal('');
	const navigate = useNavigate();
	let errorDialog: HTMLDialogElement | undefined;

	return (
		<div class="flex place-content-center items-center w-full h-full">
			<TrivialErrorModal ref={errorDialog} errorMessage={errorMessage()} />
			<div class="card bg-base-200 shadow-lg w-fit px-5 py-4">
				<h2 class="card-title">Setup</h2>
				<div class="card-body">
					<div class="join w-full">
						<input
							class="input input-bordered join-item"
							type="text"
							placeholder="sing-box Daemon Path"
							onChange={(event) => setDaemonPath(event.currentTarget.value)}
							value={daemonPath()}
						/>
						<button
							type="button"
							class="btn bg-base-300 join-item"
							onClick={() => {
								os.platform()
									.then((platform) => {
										dialog
											.open({
												multiple: false,
												filters:
													platform === 'win32'
														? [{ extensions: ['exe'], name: 'executables' }]
														: [],
											})
											.then((path) => {
												setDaemonPath(path as string);
											})
											.catch((error: Error) => {
												throw error;
											});
									})
									.catch((error: Error) => {
										throw error;
									});
							}}
						>
							Browse
						</button>
					</div>
					<div class="join w-full">
						<div class="btn bg-base-300">:</div>
						<input
							class="input input-bordered join-item w-full"
							type="number"
							placeholder="Service Port"
							min="1"
							max="65535"
							onChange={(event) =>
								setDaemonPort(Number.parseInt(event.currentTarget.value, 10))
							}
							value={daemonPort()}
						/>
						<button
							type="button"
							class="btn bg-base-300 join-item"
							onClick={() => {
								setDaemonPort(randomPort());
							}}
						>
							Randomize
						</button>
					</div>
					<div class="form-control w-full">
						<label class="label cursor-pointer">
							<span class="label-text">Run Daemon on App Start</span>
							<input type="checkbox" class="toggle toggle-success" checked />
						</label>
					</div>
				</div>
				<div class="card-actions justify-end">
					<button
						type="button"
						class="btn btn-primary"
						onClick={() => {
							if (!daemonPath().trim()) {
								setErrorMessage('Please select a sing-box binary!');
								errorDialog!.showModal();
								return;
							}

							setDaemonConfig(daemonConfig());
							invoke('set_singbox_daemon_params', {
								listenPort: daemonConfig().listenPort,
								daemonPath: daemonConfig().daemonPath,
							}).then(
								(_) => {
									navigate(Routes.Dashboard);
								},
								(error) => {
									// eslint-disable-next-line @typescript-eslint/no-unsafe-call
									setErrorMessage(error.toString());
									errorDialog!.showModal();
								}
							);
						}}
					>
						Save
					</button>
					<button
						type="button"
						class="btn btn-success"
						onClick={() => {
							if (!daemonPath().trim()) {
								setErrorMessage('Please select a sing-box binary!');
								errorDialog!.showModal();
								return;
							}

							setDaemonConfig(daemonConfig());
							invoke('set_singbox_daemon_params', {
								listenPort: daemonConfig().listenPort,
								daemonPath: daemonConfig().daemonPath,
							}).catch((error) => {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-call
								setErrorMessage(error.toString());
								errorDialog!.showModal();
							});
							invoke('start_singbox_daemon').then(
								(_) => {
									navigate(Routes.Dashboard);
								},
								(error) => {
									// eslint-disable-next-line @typescript-eslint/no-unsafe-call
									setErrorMessage(error.toString());
									errorDialog!.showModal();
								}
							);
						}}
					>
						Start
					</button>
				</div>
			</div>
		</div>
	);
}

export default Setup;
