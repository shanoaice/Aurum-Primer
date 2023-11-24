import { type ParentComponent } from 'solid-js';

type TrivivalErrorModalProps = {
	ref: HTMLDialogElement | undefined;
};

const TrivialErrorModal: ParentComponent<TrivivalErrorModalProps> = (props) => {
	return (
		<dialog class="modal border-double border-4 border-error" ref={props.ref}>
			<div class="modal-box">
				<form method="dialog">
					<button
						class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 icon-[fluent--dismiss-20-regular] hover:icon-[fluent--dismiss-20-filled]"
						type="submit"
					/>
				</form>
				{props.children}
			</div>
			<form method="dialog" class="modal-backdrop">
				<button type="submit">close</button>
			</form>
		</dialog>
	);
};

export default TrivialErrorModal;
