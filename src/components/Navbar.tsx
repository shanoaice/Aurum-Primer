import { For, type ParentComponent } from 'solid-js';
import { AppRoutes } from '../constants/Routes';
import { A } from '@solidjs/router';
import LogoText from './LogoText';

const Nav: ParentComponent<{ tooltip: string; href: string }> = (props) => (
	<div class="tooltip tooltip-bottom group/nav-btn" data-tip={props.tooltip}>
		<A
			class="rounded-box flex place-content-center btn btn-ghost"
			href={props.href}
		>
			{props.children}
		</A>
	</div>
);

const Navbar = () => {
	const navs = () => [
		{
			icon: (
				<div class="icon-[fluent--home-24-regular] group-hover/nav-btn:icon-[fluent--home-24-filled] scale-150" />
			),
			name: 'dashboard',
			route: AppRoutes.Dashboard,
		},
		{
			icon: (
				<div class="icon-[fluent--earth-24-regular] group-hover/nav-btn:icon-[fluent--earth-24-filled] scale-150" />
			),
			name: 'proxies',
			route: AppRoutes.Proxies,
		},
		{
			icon: (
				<div class="icon-[fluent--ruler-24-regular] group-hover/nav-btn:icon-[fluent--ruler-24-filled] scale-150" />
			),
			name: 'rules',
			route: AppRoutes.Rules,
		},
		{
			icon: (
				<div class="icon-[fluent--plug-connected-24-regular] group-hover/nav-btn:icon-[fluent--plug-connected-24-filled] scale-150" />
			),
			name: 'connections',
			route: AppRoutes.Connections,
		},
		{
			icon: (
				<div class="icon-[fluent--settings-24-regular] group-hover/nav-btn:icon-[fluent--settings-24-filled] scale-150" />
			),
			name: 'settings',
			route: AppRoutes.Settings,
		},
	];

	return (
		<div class="navbar shadow-md rounded-md px-4">
			<div class="navbar-start">
				<LogoText />
			</div>
			<div class="navbar-content flex">
				<For each={navs()}>
					{(nav) => (
						<Nav href={nav.route} tooltip={nav.name}>
							{nav.icon}
						</Nav>
					)}
				</For>
			</div>
		</div>
	);
};

export default Navbar;
