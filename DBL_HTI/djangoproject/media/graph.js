var widthGraphSVG = 900;
var heightGraphSVG = 700;

var nodeColor;
var clickedCell;
var clickedNode;
var deleteNode;
var showSVG = false;
var deletedNodes = [];

var color = d3.scaleOrdinal()
    .range(d3.schemeCategory20);

// Gets called whenever a node in graphCanvas.js is clicked
function draw() {

    //console.log("data: ", nodelink_data);
    nodeColor = document.getElementById("nodeColor").value;

    d3.selectAll("#graphs > svg ").remove();

    var svg = d3.select("#graphs")
        .append("svg")
        // Add panning & (moderate) zooming
        .call(d3.zoom()
            .scaleExtent([1 / 2, 3])
            .on("zoom", function() {
            svg.attr("transform", d3.event.transform)
        }));

    svg.attr("width", widthGraphSVG)
        .attr("height", heightGraphSVG);

    svg.selectAll("graphs > svg > *").remove();

    nodeColor = document.getElementById("nodeColor").value;

    d3.json(nodelink_data, function(data) {

        // Define the properties of the force directed graph simulation
        var force = d3.forceSimulation(data.nodes)
            .force("charge", d3.forceManyBody().strength(-15))
            .force("link", d3.forceLink(data.links))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force("center", d3.forceCenter().x(widthGraphSVG / 2).y(heightGraphSVG / 2));

        // Max value of d.value
        var max_val = d3.max(data.links, function (d) {
            return d.value;
        });

        // Scale to scale the opacity of the edges by d.value
        var valueScale = d3.scaleLinear()
            .domain([0, max_val])
            .range([0.05, 1]);

        // Max value of d.incoming
        var max_inc = d3.max(data.nodes, function (d) {
            return d.incoming;
        });

        // Scale to scale the radius of the nodes by d.incoming
        var radiusScale = d3.scaleLinear()
            .domain([0, max_inc])
            .rangeRound([3, 8])
            .nice();

        var filtered_link_data;
        if (clickedNode) {
            filtered_link_data = data.links.filter(function (d) {
                return d.source.cluster === clickedNode.cluster || d.target.cluster === clickedNode.cluster;
            })
        }
        else if (clickedCell) {
            filtered_link_data = data.links.filter(function (d) {
                return d.source.cluster === data.nodes[clickedCell.source].cluster || d.target.cluster === data.nodes[clickedCell.source].cluster;
            })
        }

        var filtered_node_data;
        if (clickedNode) {
            filtered_node_data = data.nodes.filter(function (d) {
                return d.cluster === clickedNode.cluster;
            })
        }
        else if (clickedCell) {
            filtered_node_data = data.nodes.filter(function (d) {
                return d.cluster === data.nodes[clickedCell.source].cluster;
            })
        }

        // If Delete node button is pressed, filter that SVG node and attached links
        if (deleteNode) {
            filtered_node_data = filtered_node_data.filter(function (d) {
                return d.id !== clickedNode.id;
            });

            filtered_link_data = filtered_link_data.filter(function (d) {
                    return d.source.id !== clickedNode.id && d.target.id !== clickedNode.id
                });
            deleteNode = false;
        }

        // All of the edges / links
        var links = svg.selectAll(".link")
            .attr('class', 'link')
            // We only render the links for which the target/source is in the given cluster
            .data(filtered_link_data)
            .enter()
            .append("line")
            .style("stroke", function(d) {
                return "rgba(0, 0, 0, " + valueScale(d.value) + ")";
            })
            .style("stroke-width", 1)
            .attr("marker-end", function(d) {
                if (valueScale(d.value) >= 0.8) {
                    return "url(#arrowheadBlack)";
                }
                else {
                    return "url(#arrowhead)";
                }
            });

        // All of the nodes
        var nodes = svg.selectAll(".node")
            .attr('class', 'node')
            // We only render the nodes which are in the given cluster
            .data(filtered_node_data)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                // If node was selected from Canvas, make it bigger
                if (clickedNode) {
                    if (d.id === clickedNode.id) {
                        return nodeRadius(d) + 2;
                    } else {
                        return nodeRadius(d);
                    }
                }
                else if (clickedCell) {
                    if (d.id === clickedCell.source || d.id === clickedCell.target) {
                        return nodeRadius(d) + 2;
                    }
                    else {
                        return nodeRadius(d);
                    }
                }
            })
            .style("fill", function (d) {
                // If node was selected from Canvas, make it red on svg
                if (clickedNode) {
                    if (d.id !== clickedNode.id) {
                        return nodeColor;
                    } else {
                        return "red";
                    }
                }
                else if (clickedCell) {
                    if (d.id === clickedCell.source || d.id === clickedCell.target) {
                        return "red";
                    }
                    else {
                        return nodeColor;
                    }
                }
            })
            // Outline of the node
            .style("stroke", "black")
            .style("stroke-width", "1")
            // Drag functions
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragging)
                .on("end", dragEnded));

        // We add a 'title' to the node by hovering over it with id + name
        nodes.append("title")
            .text(function (d) {
                return d.id + ": " + d.name + " [" + d.cluster + "]";
            });

        // Mouse over function
        nodes.on('mouseover', function (d) {
            // Highlight the nodes: every node is green except of him
            nodes.style('opacity', .2);
            d3.select(this).style('opacity', 1);
            // Save current node as thisNode
            thisNode = d;
            // Color connected edges:
            // Incoming edges/arrows: blue
            // Outgoing edges/arrows: red
            links.style("stroke", function (d) {
                if (d.source === thisNode) {
                    return "red"
                } else if (d.target === thisNode) {
                    return "blue";
                } else {
                    return "rgba(0, 0, 0, " + valueScale(d.value) + ")";
                }
            })
            // Also change the arrowheads
                .attr("marker-end", function (d) {
                    if (d.source === thisNode) {
                        return "url(#arrowheadRed)";
                    } else if (d.target === thisNode) {
                        return "url(#arrowheadBlue)";
                    } else {
                        if (valueScale(d.value) >= 0.8) {
                            return "url(#arrowheadBlack)";
                        }
                        else {
                            return "url(#arrowhead)";
                        }
                    }
                })
        });

        // Mouse out function
        nodes.on('mouseout', function (d) {
            nodes.style('opacity', 1);
            links.style("stroke", function(d) {
                return "rgba(0, 0, 0, " + valueScale(d.value) + ")";
            })
                .attr("marker-end", function(d) {
                    if (valueScale(d.value) >= 0.8) {
                        return "url(#arrowheadBlack)";
                    }
                    else {
                        return "url(#arrowhead)";
                    }
                });
        });

        // When node is clicked, make node red, bigger and change detail window
        nodes.on("click", function (d) {

            nodes.style("opacity", .2)
                .style("fill", nodeColor)
                .attr("r", function (d) {
                    return nodeRadius(d);
                });

            d3.select(this).style("fill", "red")
                .style("opacity", 1)
                .attr("r", function (d) {
                    return nodeRadius(d) + 2;
                });

            clickedNode = d;

            // Update detail window info after node is clicked
            pCluster.innerHTML = "Cluster: " + d.cluster;
            pName.innerHTML = "Name: " + d.name;
            pID.innerHTML = "ID: " + d.id;
        });

        function nodeRadius(d) {
            if (d.incoming <= 0) {
                return 2;
            } else {
                return radiusScale(d.incoming);
            }
        }

        // This is for the arrowhead (gray)
        svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", "16")
            .attr("refY", "0")
            .attr("orient", "auto")
            .attr("markerWidth", "6")
            .attr("markerHeight", "6")
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "#ccc")
            .style("stroke", "none");

        // This is for the arrowhead (gray)
        svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrowheadBlack")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", "16")
            .attr("refY", "0")
            .attr("orient", "auto")
            .attr("markerWidth", "6")
            .attr("markerHeight", "6")
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "#000")
            .style("stroke", "none");

        // This is for the red arrowhead
        svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrowheadRed")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", "16")
            .attr("refY", "0")
            .attr("orient", "auto")
            .attr("markerWidth", "6")
            .attr("markerHeight", "6")
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "red")
            .style("stroke", "none");

        // This is for the red arrowhead
        svg.append("svg:defs").append("svg:marker")
            .attr("id", "arrowheadBlue")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", "16")
            .attr("refY", "0")
            .attr("orient", "auto")
            .attr("markerWidth", "6")
            .attr("markerHeight", "6")
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10 ,0 L 0,5")
            .attr("fill", "blue")
            .style("stroke", "none");

        //Every time the simulation "ticks", this will be called
        force.on("tick", function () {

            links.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            nodes.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                    return d.y;
                });
        });

        //Define drag event functions
        function dragStarted(d) {
            if (!d3.event.active) force.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragging(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragEnded(d) {
            if (!d3.event.active) force.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    });

}
