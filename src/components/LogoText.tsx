import { A } from '@solidjs/router';
import AppRoutes from '../constants/Routes';

const LogoText = () => (
	<A
		class="text-md flex items-center whitespace-nowrap font-bold sm:text-xl"
		href={AppRoutes.Dashboard}
	>
		<div class="text-primary">Tellurium</div>.
		<div class="text-secondary">Primer</div>
	</A>
);

export default LogoText;
