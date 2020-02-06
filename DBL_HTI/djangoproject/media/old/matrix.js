const matrix_margin = {top: 80, right: 0, bottom: 10, left: 80},
    matrix_width = 720 - matrix_margin.left - matrix_margin.right,
    matrix_height = 720 - matrix_margin.top - matrix_margin.bottom;
let matrix = [];
let row_labels = [];
let col_labels = [];
svg = d3.select("#heatmap").append("svg")
    .attr("width", matrix_width + matrix_margin.left + matrix_margin.right)
    .attr("height", matrix_height + matrix_margin.top + matrix_margin.bottom)
    .append("g")
    .attr("transform", "translate(" + matrix_margin.left + "," + matrix_margin.top + ")");

function enable_matrix_controls(){
    $("#matrix-controls").children('button').each(function () {
        $(this).removeAttr("disabled");
    });
}

function disable_matrix_controls(){
    $("#matrix-controls").children('button').each(function () {
        $(this).attr("disabled", "disabled");
    });
}

function disable_matrix() {
    d3.selectAll("#heatmap > svg > g > * ").remove();
    disable_matrix_controls();
}

matrix_data = null;

function enable_matrix() {
    enable_matrix_controls();
    data = matrix_data;
    matrix = data.matrix;
    col_labels = data.labels;
    row_labels = data.labels;
    console.log(data);
    table({matrix: matrix, row_labels: data.labels, col_labels: col_labels});
}

function random_permute() {
    table.order(reorder.randomPermutation(matrix.length),
        reorder.randomPermutation(matrix[0].length));
}

function optimal_leaf_order_permute() {
    var transpose = reorder.transpose(matrix),
        dist_rows = reorder.dist()(matrix),
        dist_cols = reorder.dist()(transpose),
        order = reorder.optimal_leaf_order(),
        row_perm = order.distanceMatrix(dist_rows)(matrix),
        col_perm = order.distanceMatrix(dist_cols)(transpose);

    table.order(row_perm, col_perm);
}

function initial_order_permute() {
    table.order(reorder.permutation(matrix.length),
        reorder.permutation(matrix[0].length));
}

disable_matrix_controls();
