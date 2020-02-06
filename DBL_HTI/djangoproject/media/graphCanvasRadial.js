var graphCanvasWidth;
var graphCanvasHeight;
var searchRadius = 10;

var clickedNode;
var deleteNode;
var clickedCell;
var stopSimulation;
var showSVG = false;

var color = d3.scaleOrdinal()
    .range(d3.schemeCategory20);

function renderGraphCanvasRadial() {
    d3.json(nodelink_canvas_data_location, function(data) {

        $('#zoomingEnable').css("display", "none");
        $("#forceGravity").css("display", "none");
        $("#forceGravityLabel").css("display", "none");
        $("#circleRadius").css("display", "inline-block");
        $("#circleRadiusLabel").css("display", "inline-block");
        $("#arcDistance").css("display", "none");
        $("#arcDistanceLabel").css("display", "none");

        var canvas = document.querySelector("#graphCanvas");
        var context = canvas.getContext("2d");

        canvas.height = graphCanvasHeight;
        canvas.width = graphCanvasWidth;

        var simulation = d3.forceSimulation()
        //.force("charge", d3.forceManyBody().strength(-15))
            .force("link", d3.forceLink());

        circleRadius = document.getElementById("circleRadius").value;

        // Collection of nodes and edges
        var nodes = data.nodes;
        var links = data.links;

        // Max value of d.value
        var max_val = d3.max(links, function(d) {
            return d.value;
        });

        // Scale to scale the opacity of the edges by d.value
        var valueScale = d3.scaleLinear()
                            .domain([0, max_val])
                            .range([0.05, 1]);

        var emphValueScale = d3.scaleLinear()
                            .domain([0, max_val])
                            .range([0.25, 1]);

        // Max value of d.incoming
        var max_inc = d3.max(nodes, function(d) {
            return d.incoming;
        });

        // Scale to scale the radius of the nodes by d.incoming
        var radiusScale = d3.scaleLinear()
                            .domain([0, max_inc])
                            .rangeRound([3, 9])
                            .nice();

        // Nest nodes by d.cluster
        var vertices = d3.nest()
            .key(function(d) { return d.cluster; })
            .entries(data.nodes);

        // Nest edges by d.value
        var lines = d3.nest()
            .key(function(d) { return d.value; })
            .entries(data.links);

        simulation
            .nodes(data.nodes)
            .on("tick", update);

        simulation.force("link")
            .links(data.links);

        d3.select(canvas)
            .on("mousemove", mousemoved)
            .on("click", clicked);

        // Function for updating canvas
        function update() {
            context.clearRect(0, 0, graphCanvasWidth, graphCanvasHeight);
            context.save();
            context.translate(graphCanvasWidth/2, graphCanvasHeight/2);

            // Delete selected node if node is selected and delete button has been pressed
            if (deleteNode && clickedNode) {
                data.nodes = data.nodes.filter(function (node) {
                    return node.id !== clickedNode.id
                });

                data.links = data.links.filter(function (link) {
                    return link.source.id !== clickedNode.id && link.target.id !== clickedNode.id
                });

                vertices = d3.nest()
                    .key(function (d) {
                        return d.cluster;
                    })
                    .entries(data.nodes);

                lines = d3.nest()
                    .key(function (d) {
                        return d.value;
                    })
                    .entries(data.links);
            }

            // Drawing each edge
            lines.forEach(function(edge) {
                edge.values.forEach(drawLink);
            });

            // Drawing each vertex
            vertices.forEach(function(vertex) {
                vertex.values.forEach(drawNode);
            });

            if (stopSimulation) {
                stopSimulation = false;
                simulation.nodes({});
                transform = d3.zoomIdentity;
                d3.select(canvas).call(d3.zoom().transform, d3.zoomIdentity);
                simulation.stop();
            }

            //console.log("Circle radius: " + circleRadius);
            context.restore();
        }

        // Function for drawing a link
        function drawLink(d) {
            var opacity = valueScale(d.value);
            var strokeColor;
            if (!clickedNode) {
                strokeColor = "rgba(0, 0, 0, " + valueScale(d.value) + ")";
            }
            else if (d.source.cluster === clickedNode.cluster || d.target.cluster === clickedNode.cluster) {
                strokeColor = "rgba(0, 0, 0, " + emphValueScale(d.value) + ")";
            }
            else {
                strokeColor = "rgba(0, 0, 0, 0.05)";
            }
            context.beginPath();
            context.moveTo(d.source.radX * circleRadius, d.source.radY * circleRadius);
            context.lineTo(d.target.radX * circleRadius, d.target.radY * circleRadius);
            context.strokeStyle = strokeColor;
            context.stroke();
        }

        // Function for drawing a node
        function drawNode(d) {

            var fill;
            var fillRGB = hexToRgb(color(d.cluster));
            var strokeColor;
            var radius = nodeRadius(d);

            // Set node opacity based on selected cluster
            if (clickedNode) {
                if (d.id === clickedNode.id) {
                    fill = "red";
                    radius += 2;
                } else if (!clickedNode.cluster) {
                    fill = color(d.cluster);
                } else if (d.cluster === clickedNode.cluster) {
                    fill = color(d.cluster);
                } else {
                    fill = "rgba(" + fillRGB.r + ", " + fillRGB.g + ", " + fillRGB.b + ", 0.95)";
                }
            } else if (clickedCell) {
                if (d.id === clickedCell.source || d.id === clickedCell.target) {
                    fill = "red";
                    radius += 2;
                } else {
                    fill = color(d.cluster);
                }
            } else {
                fill = color(d.cluster);
            }

            if (!selectedCluster || !clickedNode) {
                strokeColor = "#000";
            } else if (d.cluster === selectedCluster) {
                strokeColor = "#000";
            } else {
                strokeColor = "#7f7f7f";
            }

            context.fillStyle = fill;
            context.beginPath();
            context.arc(d.radX * circleRadius, d.radY * circleRadius, radius, 0, Math.PI * 2, true);
            context.fill();
            context.strokeStyle = strokeColor;
            context.lineWidth = 1;
            context.stroke();
            context.closePath();
        }

        function mousemoved() {
            //
        }

        // Function that is triggered when you move the mouse (add hover-over)
        function clicked() {
            if (!d3.event.active) simulation.alphaTarget(0).restart();
            point = d3.mouse(this);
            var mouseX = point[0] - graphCanvasWidth/2;
            var mouseY = point[1] - graphCanvasHeight/2;
            //console.log(mouseX + ", " + mouseY);
            data.nodes.forEach(function(d) {
                var dx = (d.radX * circleRadius) - mouseX;
                var dy = (d.radY * circleRadius) - mouseY;
                var distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance <= searchRadius) {
                    if (d !== clickedNode) {

                        clickedNode = d;
                        selectedCluster = d.cluster;

                        if (showSVG) {
                            draw();
                        }
                    } else {
                        clickedNode = undefined;
                        selectedCluster = undefined;
                        clickedCell = undefined;
                    }
                }
            });

            enabledHighlight = document.getElementById("enabledHighlight").checked;

            if (clickedNode) {
                // Get d.cluster, d.name and d.id of clicked node
                pCluster.innerHTML = "Component: " + clickedNode.cluster;
                pName.innerHTML = "Name: " + clickedNode.name;
                pID.innerHTML = "ID: " + clickedNode.id;
            }

            if (enabledHighlight) {
                drawMatrixCanvas();
            } else {
                updateInfo();
            }
        }

        function nodeRadius(node) {
            if (node.incoming <= 0) {
                return 2;
            }
            else {
                return radiusScale(node.incoming);
            }
        }
    });

    function simInit(){
        $("#forceGravityLayoutButton").click(function(){
            stopSimulation = true;
        });

        $("#arcLayoutButton").click(function(){
            stopSimulation = true;
        });
    }

    simInit()
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
