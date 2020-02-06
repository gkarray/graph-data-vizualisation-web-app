// <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="utf-8">
//     <title>Heatmap</title>
//     <style>
// body {
//   font: 10px sans-serif;
// }
// line {
//   stroke: #000;
// }
//     </style>
//     <script src="../../lib/d3.v3.js"></script>
//     <script src="../../lib/science.v1.js"></script>
//     <script src="../../lib/tiny-queue.js"></script>
//     <script src="../../reorder.v1.js"></script>
//   </head>
//   <body>
//     <button type="button" onclick="order(reorder.randomPermutation(n), reorder.randomPermutation(m))">Permute Randomly</button>
//     <div id='heatmap'></div>
// <script>

// var margin = {top: 80, right: 0, bottom: 10, left: 80},
//     width = 720 - margin.left - margin.right,
//     height = 720 - margin.top - margin.bottom;

function table(json) {
    var matrix = json.matrix,
	row_labels = json.row_labels,
	col_labels = json.col_labels,
	row_perm = json.row_permutation,
	col_perm = json.col_permutation,
	row_inv, col_inv,
	n = matrix.length,
	m = matrix[0].length,
	i;

    if (! row_labels) {
	row_labels = Array(n);
	for (i = 0; i < n; i++)
	    row_labels[i] = i+1;
    }
    if (! col_labels) {
	col_labels = Array(m);
	for (i = 0; i < n; i++)
	    col_labels[i] = i+1;
    }

    if (! row_perm)
	row_perm = reorder.permutation(n);
    row_inv = reorder.inverse_permutation(row_perm);

    if (! col_perm)
	col_perm = reorder.permutation(m);
    col_inv = reorder.inverse_permutation(col_perm);

    // Get max weight
    var max_weight = d3.max(json.matrix, function(d) {
        return d3.max(d);
    })

    // Scale weight from 0 to 1
    var weightScale = d3.scaleLinear()
        .domain([0, max_weight])
        .range([0, 1])

    // Apply correct coloring
    var magmaColors = d3.scaleSequential()
        .interpolator(d3.interpolateMagma);

    var gridSize = Math.min(matrix_width / matrix.length, matrix_height / matrix[0].length),
	h = gridSize,
	th = h*n,
	w = gridSize,
	tw = w*m;

    var x = function(i) { return w*col_inv[i]; },
	y = function(i) { return h*row_inv[i]; };

    var row = svg
	    .selectAll(".row")
	    .data(matrix, function(d, i) { return 'row'+i; })
	    .enter().append("g")
            .attr("id", function(d, i) { return "row"+i; })
            .attr("class", "row")
            .attr("transform", function(d, i) {
		return "translate(0,"+y(i)+")";
	    });

    var cell = row.selectAll(".cell")
	    .data(function(d) { return d; })
	    .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function(d, i) { return x(i); })
            .attr("width", w)
            .attr("height", h)
        .style('fill', d => magmaColors(weightScale(d)))
		//.style('fill-opacity', d => d.weight * 0.684);

    // Give every cell a hover-over with its weight
    cell.append("title")
        .text(function(d) { return d; })

    row.append("line")
	.attr("x2", tw);

    row.append("text")
	.attr("x", -6)
	.attr("y", h / 2)
	.attr("dy", ".32em")
	.attr("text-anchor", "end")
	.text(function(d, i) { return row_labels[i]; });

    var col = svg.selectAll(".col")
	    .data(matrix[0])
	    .enter().append("g")
	    .attr("id", function(d, i) { return "col"+i; })
	    .attr("class", "col")
	    .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    col.append("line")
	.attr("x1", -th);

    col.append("text")
	.attr("x", 6)
	.attr("y", w / 2)
	.attr("dy", ".32em")
	.attr("text-anchor", "start")
	.text(function(d, i) { return col_labels[i]; });

    svg.append("rect")
	.attr("width", tw)
	.attr("height", th)
	.style("fill", "none")
	.style("stroke", "black");

    function order(rows, cols) {
	row_perm = rows;
	row_inv = reorder.inverse_permutation(row_perm);
	col_perm = cols;
	col_inv = reorder.inverse_permutation(col_perm);

	var t = svg.transition().duration(1500);

	t.selectAll(".row")
            .attr("transform", function(d, i) {
		return "translate(0," + y(i) + ")"; })
	    .selectAll(".cell")
            .attr("x", function(d, i) { return x(i); });

	t.selectAll(".col")
            .attr("transform", function(d, i) {
		return "translate(" + x(i) + ")rotate(-90)"; });
    }
    table.order = order;
}
