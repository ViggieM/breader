declare module 'overtype' {
	export interface OverTypeInstance {
		destroy(): void;
		setValue(value: string): void;
		reinit(): void;
	}

	export interface OverTypeTheme {
		colors?: {
			bgPrimary?: string;
			bgSecondary?: string;
			text?: string;
			h1?: string;
			h2?: string;
			h3?: string;
			strong?: string;
			em?: string;
			link?: string;
			code?: string;
			codeBg?: string;
			blockquote?: string;
			hr?: string;
			syntaxMarker?: string;
			cursor?: string;
			selection?: string;
		};
	}

	export interface OverTypeOptions {
		el?: HTMLElement;
		toolbar?: boolean;
		value?: string;
		padding?: string;
		autoResize?: boolean;
		theme?: OverTypeTheme;
		onChange?: (value: string) => void;
		onKeyDown?: (event: KeyboardEvent) => void;
		onKeyUp?: (event: KeyboardEvent) => void;
	}

	export default class OverType {
		constructor(options: OverTypeOptions);
		static init(element: HTMLElement, options: OverTypeOptions): [OverTypeInstance];
		destroy(): void;
	}
}
