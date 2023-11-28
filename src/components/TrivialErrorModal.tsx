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
				<div class="flex flex-col">
					<div role="alert" class="alert alert-error">
						<span
							class="icon-[fluent--error-circle-24-regular]"
							data-inline="false"
						/>
						<span class="font-bold">An Error Has Occurred!</span>
					</div>
					<pre class="p-4 bg-base-300 rounded-box">
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
