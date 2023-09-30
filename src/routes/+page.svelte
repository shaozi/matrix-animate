<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/Button.svelte';
	import { Matrix } from './matrix';
	import type { Block } from './types';
	import * as d3 from 'd3';
	let indexToDel: number = 0;
	let data: Block[] = [];
	const totalRows = 10;
	const totalColumns = 10;
	const blockSize = 32;
	const svgWidth = 1000;
	const svgHeight = 1000;
	let svg;
	let matrix: Matrix;
	for (let row = 0; row < totalRows; row++) {
		for (let column = 0; column < totalColumns; column++) {
			let color = {
				r: Math.floor(Math.random() * 256),
				g: Math.floor(Math.random() * 256),
				b: Math.floor(Math.random() * 256)
			};
			data.push({
				id: `${row},${column}`,
				row: row,
				column: column,
				color: color,
				label: `${row * column}`,
				value: row * column
			});
		}
	}
	onMount(() => {
		svg = d3
			.select('#dataframe')
			.append('svg')
			.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
			.attr('width', svgWidth)
			.attr('height', svgHeight);
		matrix = new Matrix({
			data: data,
			svg: svg,
			totalColumns: totalColumns,
			totalRows: totalRows,
			blockSize: 30,
			x: 10,
			y: 10
		});
	});
</script>

<div class="my-10 text-center text-5xl font-extrabold">
	<h1 class="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
		Matrix Manipulate Visulazation
	</h1>
</div>
<div class="my-5 text-center text-3xl font-extralight">SvelteKit + d3 + Tailwindcss</div>
<div class="text-center">
	<div>
		<label for="value">Parameter:</label>
		<input
			id="value"
			class="border p-1 m-1 rounded-sm focus:ring-sky-200"
			type="number"
			bind:value={indexToDel}
		/>
	</div>
	<div>
		<Button
			on:click={() => {
				matrix.drop({ index: indexToDel, axis: 'row' });
			}}
		>
			Delete row
		</Button>
		<Button
			on:click={() => {
				matrix.drop({ index: indexToDel, axis: 'column' });
			}}
		>
			Delete column
		</Button>
		<Button
			on:click={() => {
				matrix.transpose();
			}}
		>
			Transpose
		</Button>

		<Button
			on:click={() => {
				matrix.ghostMoveVector({ index: indexToDel, axis: 'row' }, 0, totalRows * (blockSize + 4));
			}}
		>
			Move Row
		</Button>
		<Button
			on:click={() => {
				matrix.ghostMoveVector(
					{ index: indexToDel, axis: 'column' },
					totalColumns * (blockSize + 4),
					0
				);
			}}
		>
			Move Column
		</Button>
	</div>
</div>
<div id="dataframe" class="w-full p-3 overflow-auto"/>

<style>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
