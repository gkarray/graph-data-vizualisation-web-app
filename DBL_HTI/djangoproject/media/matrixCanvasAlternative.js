var matrixCanvasWidth;
var matrixCanvasHeight;
var scalar;
var clickedNode;
var clickedCell;
var colorScheme;
var mouseX;
var mouseY;
var permute;
var showSVG = false;
var latestTransform = {x: 1, y:1, k:1};
var enabledHighlight;
var currentLayout;

// Elements that are used to display selected cluster #, name & ID
var pSource = document.createElement("p");
var pTarget = document.createElement("p");
var pValue = document.createElement("p");
pSource.innerHTML = "Source: ";
pTarget.innerHTML = "Target: ";
pValue.innerHTML = "Value: ";
document.getElementById("matrixInfo").appendChild(pSource);
document.getElementById("matrixInfo").appendChild(pTarget);
document.getElementById("matrixInfo").appendChild(pValue);

var canvasMatrix = document.getElementById("matrixCanvas");
var contextMatrix = canvasMatrix.getContext("2d");

function drawMatrixCanvas() {

    d3.json(matrixDataLocation, function (data) {

        colorScheme = document.getElementById("alternateColor").value;
        enabledHighlight = document.getElementById("enabledHighlight").checked;

        var matrix = [];
        var nodes = data.nodes;
        var links = data.links;
        var n = nodes.length;
        let divWidth = $("#matrixCanvasContainer").width();
        var scalar = Math.floor(divWidth / n);

        if (scalar < 1) {
            scalar = 1;
        }

        matrixCanvasWidth = $("#matrixCanvasContainer").width();
        matrixCanvasHeight = $("#matrixCanvasContainer").height();

        canvasMatrix.height = Math.min(matrixCanvasWidth, matrixCanvasHeight);
        canvasMatrix.width = Math.min(matrixCanvasWidth, matrixCanvasHeight);

        var names = {};
        for (var i = 0; i < n; i++) {
            names[nodes[i].name] = i;
        }
        //console.log(names);

        var k = 0;
        var value;

        // Get data in full 2D-array of objects
        for (var i = 0; i < n; i++) {
            var row = [];
            var row2 = [];
            for (var j = 0; j < n; j++) {
                if (links[k].source === i && links[k].target === j) {
                    // if (i == j) {
                    //     value = 0;
                    // }
                    value = links[k].value;
                    if (k < data.links.length - 1) {
                        k++;
                    }
                } else {
                    value = 0;
                }
                var link = {
                    "source": i,
                    "target": j,
                    "value": value
                };
                row.push(link);
            }
            matrix.push(row);
        }
        //console.log(matrix);

        d3.select(canvasMatrix)
            .on("click", clicked)
            .call(d3.zoom()
                .scaleExtent([1, 200])
                .on("zoom", zoom));

        // d3.zoom().transform(d3.select(canvasMatrix), d3.zoomIdentity);

        var max_value = d3.max(links, function (d) {
            return d.value;
        });
        //console.log("Max value: " + max_value);

        var valueScale = d3.scaleLinear()
            .domain([0, max_value])
            .range([0, 1]);

        var magmaColors = d3.scaleSequential()
            .interpolator(d3.interpolateMagma);

        var viridisColors = d3.scaleSequential()
            .interpolator(d3.interpolateViridis);

        var warmColors = d3.scaleSequential()
            .interpolator(d3.interpolateWarm);

        var coolColors = d3.scaleSequential()
            .interpolator(d3.interpolateCool);

        var cubehelixColors = d3.scaleSequential()
            .interpolator(d3.interpolateCubehelixDefault);

        var rainbowColors = d3.scaleSequential()
            .interpolator(d3.interpolateRainbow);

        function update() {
            contextMatrix.clearRect(0, 0, matrixCanvasWidth, matrixCanvasHeight);
            contextMatrix.save();

            //console.log(latestTransform);
            contextMatrix.translate(latestTransform.x, latestTransform.y);
            contextMatrix.scale(latestTransform.k, latestTransform.k);
            matrix.forEach(function (row, i) {
                row.forEach(function (d, j) {
                    drawCell(d, i, j);
                })
            });

            contextMatrix.restore();
        }

        update();

        function drawCell(d, i, j) {
            contextMatrix.fillStyle = getFill(d, i, j);
            contextMatrix.fillRect(i * scalar, j * scalar, scalar, scalar);
        }

        var lastmouse = [];
        function clicked() {
            // console.log("click");
            // var mouse = d4.mouse(this);
            // console.log("lastmouse", lastmouse);
            // console.log("mouse", d3.mouse(this));
            // lastmouse = mouse;
            // console.log(latestTransform);
            //console.log("adjusted", mouse[0] + latestTransform.x, mouse[1] + latestTransform.y);
            //update();

            switch (currentLayout) {
                case "radial":
                    renderRadial();
                    break;
                case "arc":
                    renderArc();
                    break;
            }
            //
            // if (showSVG) {
            //    draw()
            // }

            var point = d3.mouse(this);
            var pointAdjusted = latestTransform.x / latestTransform.k;

            var corrX = point[0] - latestTransform.x;
            var corrY = point[1] - latestTransform.y;
            mouseX = Math.floor(corrX / scalar / latestTransform.k);
            mouseY = Math.floor(corrY / scalar / latestTransform.k);

            clickedNode = undefined;

            clickedCell = matrix[mouseX][mouseY];

            pSource.innerHTML = "Source: " + nodes[clickedCell.source].name;
            pTarget.innerHTML = "Target: " + nodes[clickedCell.target].name;
            pValue.innerHTML = "Value: " + clickedCell.value;

            update();
        }

        function zoom() {
            var transform = d3.event.transform;
            // console.log("transform", transform);
            latestTransform = transform;
            contextMatrix.save();
            contextMatrix.clearRect(0, 0, matrixCanvasWidth, matrixCanvasHeight);
            contextMatrix.translate(transform.x, transform.y);
            contextMatrix.scale(transform.k, transform.k);
            //console.log(transform, contextMatrix);
            contextMatrix.restore();
            update();
        }

        function getFill(d, i, j) {
            var fill;
            var color;

            switch (colorScheme) {
                case "magma":
                    color = magmaColors(valueScale(d.value));
                    highlight = "#39ff14";
                    break;
                case "viridis":
                    color = viridisColors(valueScale(d.value));
                    highlight = "#fe019a";
                    break;
                case "warm":
                    color = warmColors(valueScale(d.value));
                    highlight = "#ffffff";
                    break;
                case "cool":
                    color = coolColors(valueScale(d.value));
                    highlight = "#ff073a";
                    break;
                case "cubehelix":
                    color = cubehelixColors(valueScale(d.value));
                    highlight = "#ff073a";
                    break;
                case "rainbow":
                    color = rainbowColors(valueScale(d.value));
                    highlight = "#ffffff";
                    break;
            }

            // Color for clicked node
            if (enabledHighlight) {
                if (mouseX === undefined || mouseY === undefined) {
                    fill = color;
                } else if (mouseX === i && mouseY === j) {
                    fill = highlight;
                    clickedCell = d;
                    //console.log("Source: " + data.nodes[d.source].name + ", target: " + data.nodes[d.target].name + ", value: " + d.value);
                } else if (i === mouseX || j === mouseY) {
                    fill = color;
                } else {
                    if (colorScheme == "magma" || colorScheme == "viridis") {
                        fillRGB = hexToRgb(color);
                        fill = "rgba(" + fillRGB.r + ", " + fillRGB.g + ", " + fillRGB.b + ", 0.5)";
                    } else {
                        fillRGB = getRGBValues(color);
                        fill = "rgba(" + fillRGB[0] + ", " + fillRGB[1] + ", " + fillRGB[2] + ", 0.5)";
                    }
                }
            }
            else {
                fill = color;
                highlight = color;
            }

            if (clickedNode) {
                pSource.innerHTML = "Source: " + clickedNode.name;
                pTarget.innerHTML = "Target: " + clickedNode.name;

                if (d.source == clickedNode.id && d.target == clickedNode.id) {
                    pValue.innerHTML = "Value: " + d.value;
                }
                if (enabledHighlight) {
                    if (d.source == clickedNode.id && d.target == clickedNode.id) {
                        fill = highlight;
                    } else if (d.source == clickedNode.id || d.target == clickedNode.id) {
                        fill = color;
                    } else {
                        if (colorScheme == "magma" || colorScheme == "viridis") {
                            fillRGB = hexToRgb(color);
                            fill = "rgba(" + fillRGB.r + ", " + fillRGB.g + ", " + fillRGB.b + ", 0.5)";
                        } else {
                            fillRGB = getRGBValues(color);
                            fill = "rgba(" + fillRGB[0] + ", " + fillRGB[1] + ", " + fillRGB[2] + ", 0.5)";
                        }
                    }
                }
            }

            return fill;
        }

        // Get node IDs from list of node names
        function namesToID(order) {
            // Order of new matrix is stored in indices as node IDs
            indices = [];
            for (var i = 0; i < order.length; i++) {
                // Save current label as 'name'
                var name = order[i];
                // Get index of current label as 'index'
                var index = names[name];
                indices.push(index);
            }

            return indices;
        }

        // Re-arrange the whole matrix (rows) by a list of row names
        function reArrangeRows(order, id) {
            if (!id) {
                // Order of new matrix is stored in indices as node IDs
                indices = namesToID(order);
            } else {
                indices = order;
            }

            // Iterate through matrix-rows
            new_matrix = [];
            for (var i = 0; i < indices.length; i++) {
                // Replace every column with the new order
                new_matrix.push(matrix[indices[i]]);
            }
            return new_matrix;
        }

        function reArrangeCols(order, id) {
            if (!id) {
                // Order of new matrix is stored in indices as node IDs
                indices = namesToID(order);
            } else {
                indices = order;
            }

            new_matrix = [];
            // Iterate through matrix
            for (var i = 0; i < indices.length; i++) {
                new_row = [];
                for (var j = 0; j < indices.length; j++) {
                    // Replace every entry with the new order (row-wise)
                    new_row.push(matrix[i][indices[j]]);
                }
                new_matrix.push(new_row);
            }
            return new_matrix;
        }

        // Initial order
        function initialOrder() {
            var initialorder = [];
            for (var i = 0; i < nodes.length; i++) {
                initialorder.push(nodes[i].name);
            }

            matrix = reArrangeCols(initialorder, false);
            matrix = reArrangeRows(initialorder, false);

            update();
        }

        // Random order
        function randomOrder() {
            // Get a list of all row/column names
            var initialorder = [];
            for (var i = 0; i < nodes.length; i++) {
                initialorder.push(nodes[i].name);
            }

            // Split into 2 to have different rows/columns arrangements
            initialorderRows = initialorder;
            initialorderCols = initialorder;

            randomorderRows = shuffle(initialorderRows);
            randomorderCols = shuffle(initialorderCols);

            matrix = reArrangeCols(randomorderRows, false);
            matrix = reArrangeRows(randomorderCols, false);

            update();
        }

        function sumOrder() {
            var rowOrder = data.sum_order[0];
            var colOrder = data.sum_order[1];

            matrix = reArrangeCols(rowOrder, false);
            matrix = reArrangeRows(colOrder, false);

            update();
        }

        // Reverse Cuthill-McKee order
        function reversecuthillmckeeOrder() {
            var order = data.reverse_cuthill_mckee;

            //console.log(latestTransform);
            matrix = reArrangeCols(order, true);
            matrix = reArrangeRows(order, true);

            update();
        }

        // Cuthill-McKee order
        function cuthillmckeeOrder() {
            var rowOrder = data.cuthill_mckee[0];
            var colOrder = data.cuthill_mckee[1];

            matrix = reArrangeCols(rowOrder, true);
            matrix = reArrangeRows(colOrder, true);

            update();
        }

        // Shortest path order
        function shortestpathOrder() {
            var rowOrder = data.shortest_path[0];
            var colOrder = data.shortest_path[1];

            matrix = reArrangeCols(rowOrder, true);
            matrix = reArrangeRows(colOrder, true);

            update();
        }

        function uniquevaluesOrder() {
            var rowOrder = data.unique_values[0];
            var colOrder = data.unique_values[1];

            matrix = reArrangeCols(rowOrder, false);
            matrix = reArrangeRows(colOrder, false);

            update();
        }

        function meanvaluesOrder() {
            var rowOrder = data.mean_values[0];
            var colOrder = data.mean_values[1];

            matrix = reArrangeCols(rowOrder, false);
            matrix = reArrangeRows(colOrder, false);

            update();
        }

        // Determine which permutation has to be used
        switch (permute) {
            case "initial":
                initialOrder();
                break;
            case "random":
                randomOrder();
                break;
            case "sum":
                sumOrder();
                break;
            case "reverse-cuthill-mckee":
                reversecuthillmckeeOrder();
                break;
            case "cuthill-mckee":
                cuthillmckeeOrder();
                break;
            case "shortest-path":
                shortestpathOrder();
                break;
            case "unique-values":
                uniquevaluesOrder();
                break;
            case "mean-values":
                meanvaluesOrder();
                break;
        }
    })
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getRGBValues(rgb) {
    rgb = rgb.substring(4, rgb.length - 1)
        .replace(/ /g, '')
        .split(',');

    return rgb
}

function shuffle(arr) {
    var i,
        j,
        temp;
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

function initial_order() {
    permute = "initial";
    drawMatrixCanvas();
}

function random_order() {
    permute = "random";
    drawMatrixCanvas();
}

function sum_order() {
    permute = "sum";
    drawMatrixCanvas();
}

function reversecuthillmckee_order() {
    permute = "reverse-cuthill-mckee";
    drawMatrixCanvas();
}

function cuthillmckee_order() {
    permute = "cuthill-mckee";
    drawMatrixCanvas();
}

function shortestpath_order() {
    permute = "shortest-path";
    drawMatrixCanvas();
}

function uniquevalues_order() {
    permute = "unique-values";
    drawMatrixCanvas();
}

function meanvalues_order() {
    permute = "mean-values";
    drawMatrixCanvas();
}

function reset_zoom() {
    latestTransform.x = 1;
    latestTransform.y = 1;
    latestTransform.k = 1;
    drawMatrixCanvas();
}

function disableMatrix() {
    $("#matrix > div").css("display", "none");
    $("#matrixOrderings").css("display", "none");
    $("#matrixCanvasContainer").css("display", "none");
    $(".disabledOnDisable").css("display", "none");
}

function enableMatrix() {
    $("#matrix > div").css("display", "");
    $("#matrixOrderings").css("display", "");
    $("#matrixCanvasContainer").css("display", "");
    $(".disabledOnDisable").css("display", "");
}

function downloadMatrix() {
    ReImg.fromCanvas(document.getElementById('matrixCanvas')).toPng();
    ReImg.fromCanvas(document.getElementById('matrixCanvas')).downloadPng(matrixFileName + "Matrix.png");
}

function enableHighlight() {
    enabledHighlight = document.getElementById("enabledHighlight").checked;
    if (clickedNode || clickedCell) {
        drawMatrixCanvas();
    }
}

function updateInfo() {
    if (clickedNode) {
        pSource.innerHTML = "Source: " + clickedNode.name;
        pTarget.innerHTML = "Target: " + clickedNode.name;
    }
}
