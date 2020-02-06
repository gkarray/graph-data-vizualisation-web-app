var graphCanvasWidth;
var graphCanvasHeight;
var searchRadius = 5;

var clickedNode;
var clickedCell;
var deleteNode;
var showSVG = false;
var arcDistance;
var stopSimulation;
var newIndexes = [];

var color = d3.scaleOrdinal()
    .range(d3.schemeCategory20);
var transformArc = d3.zoomIdentity ;

function renderGraphCanvasArc() {

    d3.json(nodelink_canvas_data_location, function(data) {

        $("#forceGravity").css("display", "none");
        $("#forceGravityLabel").css("display", "none");
        $("#circleRadius").css("display", "none");
        $("#circleRadiusLabel").css("display", "none");
        $("#arcDistance").css("display", "inline-block");
        $("#arcDistanceLabel").css("display", "inline-block");

        var canvas = document.querySelector("#graphCanvas");
        var context = canvas.getContext("2d");

        canvas.height = graphCanvasHeight;
        canvas.width = graphCanvasWidth;

        var simulation = d3.forceSimulation()
        //.force("charge", d3.forceManyBody().strength(-15))
            .force("link", d3.forceLink());
        //.force("center", d3.forceCenter(graphCanvasWidth / 2, graphCanvasHeight / 2));

        arcDistance = document.getElementById("arcDistance").value;

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
                            .rangeRound([2, 5])
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
            .call(d3.zoom()
                .scaleExtent([1, 1])
                .on("zoom", zoomed));

        d3.select(canvas)
          //  .on("mousemove", mousemoved)
            .on("click", clicked);

        function zoomed() {
            transformArc = d3.event.transform;
            update() ;
        }

        // Function for updating canvas
        function update() {
            context.clearRect(0, 0, graphCanvasWidth, graphCanvasHeight);
            context.save();
            context.translate(transformArc.x + 20 , transformArc.y + graphCanvasHeight/2);
            context.scale(transformArc.k, transformArc.k);
           // context.translate(20, graphCanvasHeight/2);


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
                vertex.values.forEach(addToLol);
            });

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

        function addToLol(d){
            newIndexes.push(d.id);
        }

        // Function for drawing a link
        function drawLink(d) {
            var opacity = valueScale(d.value);
            var valtmp ;
            if (!clickedNode) {
                valtmp = valueScale(d.value);
            }
            else if (d.target.cluster === clickedNode.cluster || d.source.cluster === clickedNode.cluster) {
                valtmp = 0.30 ;
            }
            else {
                valtmp = 0.05 ;
            }
            var newIndexSource = newIndexes.indexOf(d.source.id)
            var newIndexTarget = newIndexes.indexOf(d.target.id)

            diameter = Math.abs(newIndexSource - newIndexTarget) * arcDistance ;
            yValueOffset = ( diameter / 2.0) * 4.0 / 3.0 ;
            xValueInset = diameter * 0.05 ;

            pDepart = {x: newIndexSource * arcDistance , y: 0};
            pControle1 = {x: newIndexSource * arcDistance + xValueInset, y: 0 - yValueOffset};
            pControle1prim = {x: newIndexSource * arcDistance - xValueInset, y: 0 + yValueOffset};
            pControle2 = {x: newIndexSource * arcDistance + diameter - xValueInset, y:0 - yValueOffset};
            pControle2prim = {x: newIndexSource * arcDistance - diameter + xValueInset, y:0 + yValueOffset};
            pArrivee = {x: newIndexSource * arcDistance + diameter, y: 0};
            pArriveePrim = {x: newIndexSource * arcDistance - diameter, y: 0};
            //console.log(clickedNode);
            context.beginPath();
            context.moveTo(pDepart.x, pDepart.y);
                if (newIndexTarget > newIndexSource) {
                    context.bezierCurveTo(pControle1.x, pControle1.y, pControle2.x, pControle2.y, pArrivee.x, pArrivee.y);
                }
                else {
                    context.bezierCurveTo(pControle1prim.x, pControle1prim.y, pControle2prim.x, pControle2prim.y, pArriveePrim.x, pArriveePrim.y);
                }
                strokeColor = "rgba(0, 0, 0, " + valtmp + ")";
                if(clickedNode != undefined && d.source.id == clickedNode.id)
                        strokeColor ="rgba(255, 0, 0, " + 1 + ")" ;
                if(clickedNode != undefined && d.target.id == clickedNode.id)
                        strokeColor ="rgba(0, 0, 255, " + 1 + ")" ;

            context.strokeStyle = strokeColor;
            context.stroke();
        }

        // Function for drawing a node
        function drawNode(d) {
            var fill;
            var fillRGB = hexToRgb(color(d.cluster));
            var strokeColor;
            var radius = nodeRadius(d) * 2;

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
                    fill = "rgba(" + fillRGB.r + ", " + fillRGB.g + ", " + fillRGB.b + ", 0.2)";
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
            context.arc(newIndexes.indexOf(d.id) * arcDistance, 0, radius, 0, Math.PI * 2, true);
            context.fill();
            context.strokeStyle = strokeColor;
            context.lineWidth = 1;
            context.stroke();
            context.closePath();
        }

        function mousemoved() {
            // var point = d3.mouse(this);
            // var a = this.parentNode;
            // data.nodes.forEach(function(d) {
            //     var dx = (d.id * arcDistance) - point[0];
            //     var dy = 0;
            //     var distance = Math.sqrt((dx * dx) + (dy * dy));
            //     if (distance <= searchRadius) {
            //         a.setAttribute("title", d.id + ": " + d.name + " [" + d.cluster + "]");
            //     }
            //     else {
            //         a.removeAttribute("title");
            //     }
            // })
        }

        // Function that is triggered when you move the mouse (add hover-over)
        function clicked() {
            if (!d3.event.active) simulation.alphaTarget(0).restart();
            point = d3.mouse(this);
            var mouseX = point[0] - 20;
            var mouseY = point[1];

            var x = (mouseX - transformArc.x) / transformArc.k;
                var y = (mouseY - transformArc.y) / transformArc.k;
                var dx;
                var dy;


            data.nodes.forEach(function(d) {


                node = {x: newIndexes.indexOf(d.id) * arcDistance, y: graphCanvasHeight/2}
                dx = x - node.x;
                dy = y - node.y;
                var distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance <= nodeRadius(d) * 2) {
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

        $("#radialLayoutButton").click(function(){
            stopSimulation = true;
        });
    }

    simInit();
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
