export type Options = { index: number; axis: 'row' | 'column' };
export type RGB = { r: number; g: number; b: number };
export type Block = {
	id: string;
	row: number;
	column: number;
	color: RGB;
	value: number;
	label: string;
};
