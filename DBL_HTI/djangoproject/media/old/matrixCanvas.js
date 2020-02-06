var base = d3.select("#matrixCanvas");

var width;
var height;
var length;

var matrixData;

var mouseX;
var mouseY;

var coloring;

var scalar = 1;

// Create an in memory only element of type 'custom'
var detachedContainer = document.createElement("custom");

// Create a d3 selection for the detached container. We won't
// actually be attaching it to the DOM.
var custom = d3.select(detachedContainer);
var matrix = base.append("canvas")
    .on("click", clicked);
var matrixContext = matrix.node().getContext("2d");

let matrix_columns =  0;
// Function to create our custom data containers
function drawCustom(input) {

    length = input.length;

    matrixData = input;

    width = length * scalar;
    height = length * scalar;

    matrix.attr("width", width)
        .attr("height", height);

    //console.log("rendering: ", input);
    data = [];
    matrix_columns = input.length;
    input.forEach(function (e) {
        e.forEach(val => data.push(val))
    });
    //console.log(data);

    var customBase = document.createElement('custom');
    var custom = d3.select(customBase);

    databind(data); // ...then update the databind function

    var t = d3.timer(function (elapsed) {
        drawMatrix();
        if (elapsed > 500) t.stop();
    }); // start a timer that runs the draw function for 500 ms (this needs to be higher than the transition in the databind function)
}

function clicked() {
    var point = d3.mouse(this);

    mouseX = Math.floor(Math.round(point[0]) / scalar);
    mouseY = Math.floor(Math.round(point[1]) / scalar);
    console.log("Click: x: " + mouseX + ", y: " + mouseY + ", i: " + (mouseX + (length * mouseY)));

    redraw();
}

// === Bind and draw functions === //

function databind(data) {
    //console.log("binding; ", matrix_columns);

    var max_value = d3.max(data, function(d) {
        return d;
    })

    var valueScale = d3.scaleLinear()
        .domain([0, max_value])
        .range([0, 1]);

    // Apply correct coloring
    var magmaColors = d3.scaleSequential()
        .interpolator(d3.interpolateMagma);

    //let cellSpacing = Math.max( 5- (0.08*matrix_columns), 0.5); //large spacing for big cells, small spacing for small cells
    let cellSpacing = 0;
    //let cellWidth = Math.floor((width / matrix_columns) ) - cellSpacing;
    let cellWidth = scalar;
    let cellHeight = scalar;
    //let cellHeight = Math.floor(height / matrix_columns );

    var join = custom.selectAll('custom.rect')
        .data(data);

    var enterSel = join.enter()
        .append('custom')
        .attr('class', 'rect')
        .attr('x', function (d, i) {
            return  cellWidth * Math.floor(i % matrix_columns);
        })
        .attr('y', function (d, i) {
            return  cellHeight * Math.floor(i / matrix_columns);
        })
        .attr('width', 0)
        .attr('height', 0);

    join
        .merge(enterSel)
        .transition()
        .attr('width', cellWidth )
        .attr('height', cellHeight - cellSpacing)
        .attr('x', function (d, i) {
            return  cellWidth * Math.floor(i % matrix_columns);
        })
        .attr('y', function (d, i) {
            return  cellHeight * Math.floor(i / matrix_columns);
        })
        .attr('fillStyle', function (d,i) {
            return magmaColors(valueScale(d));
        });


    var exitSel = join.exit()
        .transition()
        .attr('width', 0)
        .attr('height', 0)
        .remove();

} // databind()

function drawMatrix() {
    scalar = document.getElementById("scalar").value;
    width = length * scalar;
    height = length * scalar;

    matrix.attr("width", width)
        .attr("height", height);

    if(width >= 600)
        document.getElementById("matrixContainer").style.width = width+"px"
    else
        document.getElementById("matrixContainer").style.width = "600px"

    //console.log("w: " + width);
    //console.log("h: " + height);

    // clear canvas
    matrixContext.fillStyle = 'rgba(0, 0, 0, 0)';
    matrixContext.fillRect(0, 0, width, height);
    //context.clearRect(0, 0, width, height);
    //context.save();

    // draw each individual custom element with their properties
    var elements = custom.selectAll('custom.rect') // this is the same as the join variable, but used here to draw

    elements.each(function (d, i) {

        // for each virtual/custom element...
        var node = d3.select(this);
        var fill;
        if (i === mouseX + (length * mouseY)) {
            fill = "green";
        }
        else if (Math.floor(i % length) === mouseX || Math.floor(i / length) === mouseY) {
            fill = "lightgreen"
        }
        else {
            fill = node.attr("fillStyle");
        }
        matrixContext.fillStyle = fill;
        matrixContext.fillRect(node.attr('x'), node.attr('y'), node.attr('width'), node.attr('height'))
    });

    //context.restore();
} // draw()

function redraw() {
    drawCustom(matrixData);
}

// === Listeners/handlers === //


d3.select('#text-input').on('keydown', function () {
    if (d3.event.keyCode === 13) {
        d3.select('#alert').html('');
        if (+this.value < 1 || +this.value > 10000) {
            d3.select('#text-explain').classed('alert', true);
            return;
        } else {
            d3.select('#text-explain').classed('alert', false);
            data = [];
            d3.range(+this.value).forEach(function (el) {
                data.push({value: el});
            });

            databind(data);

            var t = d3.timer(function (elapsed) {
                drawMatrix();
                if (elapsed > 500) t.stop();
            }); // start a timer that runs the draw function for 500 ms (this needs to be higher than the transition in the databind function)

        } // value test

    } // keyCode 13 === return

}); // text input listener/handler


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Simple function that changes hex to rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

drawMatrix();
