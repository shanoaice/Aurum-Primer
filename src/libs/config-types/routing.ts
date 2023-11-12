type LogicalMatcherMode = 'and' | 'or';

type RuleMatcher =
	| ['domain', string[]]
	| ['domain_suffix', string[]]
	| ['domain_keyword', string[]]
	| ['domain_regex', string[]]
	| ['ip_cidr', string[]]
	| ['geosite', string[]]
	| ['geoip', string[]]
	| ['port', number[]]
	| ['port_range', string[]]
	| ['protocol', string[]]
	| ['inbound', string[]]
	| ['clash_mode', string]
	| ['logical', LogicalMatcherMode, RoutingRule[]];

type RoutingRule =
	| {
			domain?: string[] | string;
			domain_suffix?: string[] | string;
			domain_keyword?: string[] | string;
			domain_regex?: string[] | string;
			ip_cidr?: string[] | string;
			geosite?: string[] | string;
			geoip?: string[] | string;
			port?: number[] | number;
			port_range?: string[] | string;
			protocol?: string[] | string;
			inbound?: string[] | string;
			clash_mode?: string;
			outbound: string;
			invert?: boolean;
	  }
	| {
			type: 'logical';
			mode: LogicalMatcherMode;
			rules: RoutingRule[];
			invert?: boolean;
			outbound: string;
	  };
