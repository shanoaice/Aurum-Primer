import { For, type ParentComponent } from 'solid-js';
import AppRoutes from '../constants/Routes';
import { A } from '@solidjs/router';
import LogoText from './LogoText';
import Themes from '~/constants/Themes';
import { setCurrentTheme } from '~/signals/theme';

const Nav: ParentComponent<{ tooltip: string; href: string }> = (props) => (
	<div class="tooltip tooltip-bottom group/nav-btn" data-tip={props.tooltip}>
		<A class="rounded-box btn btn-ghost" href={props.href}>
			{props.children}
		</A>
	</div>
);

const ThemeChanger = () => {
	return (
		<div class="drawer drawer-end">
			<input
				id="theme-changer-drawer-toggle"
				class="drawer-toggle"
				aria-label="hidden drawer toggle"
				type="checkbox"
			/>
			<div class="drawer-content">
				<button
					aria-label="themeChanger toggle"
					class="btn btn-circle btn-sm btn-primary"
					type="button"
				>
					<label
						for="theme-changer-drawer-toggle"
						class="icon-[fluent--color-24-regular] hover:icon-[fluent--color-24-filled] drawer-button scale-150"
					/>
				</button>
			</div>
			<div class="drawer-side z-50">
				<label
					for="theme-changer-drawer-toggle"
					class="drawer-overlay"
					aria-label="close sidebar"
				/>

				<ul class="menu gap-2 bg-base-300 p-2">
					<For each={Themes}>
						{(theme) => (
							<li>
								<button
									data-theme={theme}
									class="btn btn-xs"
									onClick={() => setCurrentTheme(theme)}
									type="button"
								>
									{theme}
								</button>
							</li>
						)}
					</For>
				</ul>
			</div>
		</div>
	);
};

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
			<div class="navbar-center flex place-content-center">
				<For each={navs()}>
					{(nav) => (
						<Nav href={nav.route} tooltip={nav.name}>
							{nav.icon}
						</Nav>
					)}
				</For>
			</div>
			<div class="navbar-end flex justify-end">
				<div>
					<ThemeChanger />
				</div>
			</div>
		</div>
	);
};

export default Navbar;
