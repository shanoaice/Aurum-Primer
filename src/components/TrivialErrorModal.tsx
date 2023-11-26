import { type Component, For } from 'solid-js';

type TrivialErrorModalProps = {
	ref: HTMLDialogElement | undefined;
	errorMessage: string;
};

const TrivialErrorModal: Component<TrivialErrorModalProps> = (props) => {
	return (
		<dialog class="modal border-double border-4 border-error" ref={props.ref}>
			<div class="modal-box">
				<form method="dialog">
					<button
						class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 icon-[fluent--dismiss-20-regular] hover:icon-[fluent--dismiss-20-filled]"
						type="submit"
					/>
				</form>
				<div role="alert" class="alert alert-error">
					<span
						class="iconify"
						data-icon="fluent:error-circle-24-filled"
						data-inline="false"
					/>
					<span>An Error Has Occurred!</span>
					<pre class="p-4 bg-base-300">
						<For each={props.errorMessage.split('\n')}>
							{(errorMessage) => <code>{errorMessage}</code>}
						</For>
					</pre>
				</div>
			</div>
			<form method="dialog" class="modal-backdrop">
				<button type="submit">close</button>
			</form>
		</dialog>
	);
};

export default TrivialErrorModal;
