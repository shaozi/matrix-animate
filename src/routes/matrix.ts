import * as d3 from 'd3';

import type { Block, Options, RGB } from './types';

export class Matrix {
	data: Block[];
	svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, never>;
	blockSize: number;
	totalRows: number;
	totalColumns: number;
	x: number;
	y: number;
	roundR: number;
	gap: number;
	padding: number;
	space: number;
	matrixGroup: d3.Selection<SVGGElement, unknown, HTMLElement, never>;

	constructor(opt: {
		svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, never>;
		data: Block[];
		totalRows: number;
		totalColumns: number;
		x?: number;
		y?: number;
		blockSize?: number;
		roundR?: number;
		gap?: number;
	}) {
		// deep copy data, we are not changing the original data in any way.
		this.data = JSON.parse(JSON.stringify(opt.data));
		this.svg = opt.svg;
		this.blockSize = opt.blockSize ?? 20;
		this.totalRows = opt.totalRows;
		this.totalColumns = opt.totalColumns;
		this.roundR = opt.roundR ?? 0;
		this.x = opt.x ?? 0;
		this.y = opt.y ?? 0;
		this.gap = opt.gap ?? 4;
		this.padding = 10;
		this.space = this.blockSize + this.gap;
		this.matrixGroup = this.draw();
	}

	toRBG(color: RGB) {
		return `rgb(${color.r % 256}, ${color.g % 256}, ${color.r % 256})`;
	}
	getContrastingColor(color: RGB) {
		const brightness = (color.r % 256) * 0.299 + (color.g % 256) * 0.587 + (color.b % 256) * 0.114;
		return brightness > 128 ? 'black' : 'white';
	}

	draw() {
		const matrixGroup = this.svg
			.append('g')
			.attr('transform', `translate(${this.x + this.padding},${this.y + this.padding})`);

		const blocks = matrixGroup
			.selectAll('g')
			.data(this.data, (d) => (d as Block).id)
			.enter()
			.append('g')
			.attr('class', 'block')
			.attr(
				'transform',
				(d: Block) =>
					`translate(${d.column * (this.blockSize + this.gap)},${
						d.row * (this.blockSize + this.gap)
					})`
			); // Add gap to the row position

		// Enter
		blocks
			.append('rect')
			.attr('rx', this.roundR)
			.attr('ry', this.roundR)
			// Add gap to the column position
			.attr('width', this.blockSize)
			.attr('height', this.blockSize)
			.attr('fill', (d: Block) => this.toRBG(d.color))
			.attr('stroke', (d: Block) => this.getContrastingColor(d.color));
		if (this.blockSize > 20) {
			const fontSize = `${Math.ceil(Math.min(this.blockSize / 2, 16))}px`;
			blocks
				.append('text')
				.attr('x', this.blockSize / 2)
				.attr('y', this.blockSize / 2)
				.attr('text-anchor', 'middle') // align the text to the middle horizontally
				.attr('dominant-baseline', 'middle') // align the text to the middle vertically
				.attr('fill', (d: Block) => this.getContrastingColor(d.color))
				.attr('font-size', fontSize)
				.text((d) => d.label);
		}
		return matrixGroup;
	}
	transpose() {
		const blocks = this.matrixGroup.selectAll('g.block').data(this.data, (d) => (d as Block).id);
		blocks
			.transition()
			.ease(d3.easeSin)
			.duration(3000)
			.attr('transform', (d) => {
				return `translate(${d.row * this.space}, ${d.column * this.space})`;
			});

		// update data
		this.data.forEach((d) => {
			[d.row, d.column] = [d.column, d.row];
		});
		[this.totalColumns, this.totalRows] = [this.totalRows, this.totalColumns];
	}

	drop(options: Options) {
		const { index, axis } = options;

		// Select all blocks
		const blocks = this.matrixGroup.selectAll('g.block').data(this.data, (d) => (d as Block).id);

		// Transition for blocks in the deleted column
		blocks
			.filter((d: Block) => d[axis] === index)
			.transition()
			.duration(1000)
			.style('opacity', 0)
			.attr(axis == 'row' ? 'height' : 'width', 0)
			.remove();

		// Transition for blocks in columns after the deleted column
		blocks
			.filter((d: Block) => d[axis] > index)
			.transition()
			.duration(1000)
			.attr('transform', (d: Block) => {
				if (axis == 'row') {
					return `translate(${d.column * this.space}, ${(d.row - 1) * this.space})`;
				}
				return `translate(${(d.column - 1) * this.space}, ${d.row * this.space})`;
			}); // Shift to the left

		// Update the data
		this.data = this.data.filter((d: Block) => d[axis] !== index);
		this.data.forEach((d) => {
			if (d[axis] > index) {
				d[axis] -= 1;
			}
		});
		if (axis == 'row') {
			this.totalRows--;
		} else {
			this.totalColumns--;
		}
	}
	highlight(options: Options) {
		const { index, axis } = options;
		const rect = this.matrixGroup
			.insert('rect', 'g')
			.attr('x', axis == 'row' ? -this.gap : index * this.space - this.gap)
			.attr('y', axis == 'row' ? index * this.space - this.gap : -this.gap)
			.attr(
				'width',
				axis == 'row' ? this.totalColumns * this.space + this.gap : this.space + this.gap
			)
			.attr(
				'height',
				axis == 'row' ? this.space + this.gap : this.totalRows * this.space + this.gap
			)
			.attr('fill', 'pink');
		return rect;
	}
	ghostMoveVector(options: Options, dX: number, dY: number) {
		const { index, axis } = options;
		const vector = this.data.filter((d) => d[axis] == index);
		const highlightRect = this.highlight(options);

		const group = this.matrixGroup
			.append('g')
			.attr(
				'transform',
				axis == 'row' ? `translate(0, ${index * this.space})` : `translate(${index * this.space},0)`
			);

		vector.forEach((d) => {
			const block = group
				.append('g')
				.attr(
					'transform',
					axis == 'row'
						? `translate(${d.column * this.space},0)`
						: `translate(0, ${d.row * this.space})`
				);
			block
				.append('rect')
				.attr('rx', this.roundR)
				.attr('ry', this.roundR)
				// Add gap to the column position
				.attr('width', this.blockSize)
				.attr('height', this.blockSize)
				.attr('fill', this.toRBG(d.color))
				.attr('stroke', this.getContrastingColor(d.color));
			if (this.blockSize > 20) {
				const fontSize = `${Math.ceil(Math.min(this.blockSize / 2, 16))}px`;
				block
					.append('text')
					.attr('x', this.blockSize / 2)
					.attr('y', this.blockSize / 2)
					.attr('text-anchor', 'middle') // align the text to the middle horizontally
					.attr('dominant-baseline', 'middle') // align the text to the middle vertically
					.attr('fill', this.getContrastingColor(d.color))
					.attr('font-size', fontSize)
					.text(d.label);
			}
		});

		group
			.transition()
			.duration(1000)
			.ease(d3.easeCubicInOut)
			.attr('transform', `translate(${dX}, ${dY})`)
			.transition()
			.delay(3000)
			.duration(1000)
			.style('opacity', 0)
			.remove()
			.on('end', () => {
				highlightRect.transition().duration(500).style('opacity', 0).remove();
			});
	}
}
