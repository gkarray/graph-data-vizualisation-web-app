import math
from .reorder import reorderBySum, reverseCuthillMckee, shortestPath, uniqueValues, meanValues

# This function takes a DataFrame and changes it into a 2D-array (matrix)
def toMatrix(df):
    # We start with an empty matrix (2D-array)
    matrix = []

    # We iterate through each row of the dataframe and add the values of the dataframe to the matrix
    for row in df.iterrows():
        index, data = row
        matrix.append(data.tolist())

    # Return this 2D-array
    return matrix


# The class for nodes with id
class Node:
    def __init__(self, id, name, cluster=0):
        self.id = id
        self.name = name
        self.indeg = 0
        self.outdeg = 0
        self.adjacency = []
        self.cluster = cluster
        self.adjacent = 0
        self.radX = 0
        self.radY = 0

    def getID(self):
        return self.id

    def getName(self):
        return self.name

    def incrInDeg(self):
        self.indeg += 1

    def incrOutDeg(self):
        self.outdeg += 1

    def getInDeg(self):
        return self.indeg

    def getOutDeg(self):
        return self.outdeg

    def resetInDeg(self):
        self.indeg = 0

    def resetOutDeg(self):
        self.outdeg = 0

    def addAdj(self, node):
        self.adjacency.append(node)
        self.adjacent += 1

    def getAdj(self):
        return self.adjacency

    def printAdj(self):
        return [node.getName() for node in self.adjacency]

    def getCluster(self):
        return self.cluster

    def setCluster(self, cluster):
        self.cluster = cluster

    def setRadX(self, radX):
        self.radX = radX

    def getRadX(self):
        return self.radX

    def setRadY(self, radY):
        self.radY = radY

    def getRadY(self):
        return self.radY

    # This function changes a node to the JSON-file format for D3
    def printNode(self):
        node_out = {"id": self.id, "name": self.name, "cluster": self.cluster, "incoming": self.indeg, "radX": self.radX, "radY": self.radY}
        return node_out


# The class for edges with id, from, to, value (weight) and color
class Edge:
    def __init__(self, src, trgt, val=0):
        self.src = src
        self.trgt = trgt
        self.val = val
        self.double = False

    def getSource(self):
        return self.src

    def getTarget(self):
        return self.trgt

    def getVal(self):
        return self.val

    def setTarget(self, trgt):
        self.trgt = trgt

    def setSource(self, src):
        self.src = src

    def setVal(self, val):
        self.val = val

    def setDouble(self, double):
        self.double = double

    def getDouble(self):
        return self.double

    # This function changes an edge to the JSON-file format
    def printEdge(self):
        edge_out = {"source": self.src, "target": self.trgt, "value": self.val}
        return edge_out


# The class for graph(s) with a list of nodes (Node objects) and edges (Edge objects)
class GraphD3:
    def __init__(self, nodes=[], edges=[]):
        self.nodes = nodes
        self.edges = edges
        self.bfs = False

    def getNodes(self):
        return self.nodes

    def getEdges(self):
        return self.edges

    def getNode(self, id):
        for node in self.nodes:
            if node.getID() == id:
                return node

    # Returns a list of edges with src as its source
    def getEdge(self, src):
        out = []
        for edge in self.edges:
            if edge.getSource() == src:
                out.append(edge)
        return out

    def setNodes(self, nodes):
        self.nodes = nodes

    def setEdges(self, edges):
        self.edges = edges

    def addNode(self, node):
        self.nodes.append(node)

    def addEdge(self, edge):
        self.edges.append(edge)

    # This function takes a DataFrame and makes a list of node objects from the DF
    def addNodes(self, df):
        names = list(df)
        # Emtpy current nodes
        self.nodes = []
        # We then iterate through the list of labels and add nodes with each label using the iterator as ID
        for i in range(len(list(df))):
            node = Node(i, names[i])
            self.nodes.append(node)

    # This function takes a dict and makes a list of node objects from the dict
    def addNodesFromDict(self, node_dict):
        # Emtpy current nodes
        self.nodes = []
        # Iterate through all nodes and make a node object
        for node in node_dict:
            try:
                new_node = Node(node["id"], node["name"], node["cluster"])
            except:
                new_node = Node(node["id"], node["name"])
            self.nodes.append(new_node)

    # This function takes a DataFrame and makes a list of edge objects from the DF
    def addEdges(self, df):
        # We have to get a matrix from the df
        matrix = toMatrix(df)
        # Emtpy current edges
        self.edges = []

        # Now we iterate through the matrix and for every non-zero element, we make an edge object
        # k = source, l = target, matrix[k][l] = value
        for k in range(len(matrix)):
            for l in range(len(matrix[0])):
                if matrix[k][l] != 0:
                    if k != l:
                        edge = Edge(k, l, matrix[k][l])
                        self.edges.append(edge)
                        # k = from, increase out-degree of node 'k' by 1
                        self.nodes[k].incrOutDeg()
                        # l = to, increase in-degree of node 'l' by 1
                        self.nodes[l].incrInDeg()

                        # Adjacency list:
                        # edge from k (source) to l (target), node k has l as neighbour, node l has k as neighbour
                        if self.nodes[k] not in self.nodes[l].getAdj():
                            self.nodes[l].addAdj(self.nodes[k])
                        if self.nodes[l] not in self.nodes[k].getAdj():
                            self.nodes[k].addAdj(self.nodes[l])

    # This function takes a dict and makes a list of edge objects from the dict
    def addEdgesFromDict(self, edge_dict):
        # Emtpy current edges
        self.edges = []
        # Iterate through all edges and make edge objects
        for edge in edge_dict:
            source = self.getNode(edge["source"])
            target = self.getNode(edge["target"])
            source.incrOutDeg()
            target.incrInDeg()

            new_edge = Edge(edge["source"], edge["target"], edge["value"])
            self.edges.append(new_edge)

            if source not in target.getAdj():
                target.addAdj(source)
            if target not in source.getAdj():
                source.addAdj(target)

    def setNodeCoordinates(self):
        print("Setting radial coordinates...")
        # Iterator for X-coordinate
        x = 0
        # Iterator for Y-coordinate
        y = 0

        step = (2 * math.pi) / len(self.nodes)

        for node in self.nodes:
            node.setRadX(math.cos(x))
            node.setRadY(math.sin(y))
            x += step
            y += step

    # Function that prints all nodes in a list in JSON-format
    def printNodes(self):
        json_nodes = []
        for node in self.nodes:
            json_nodes.append(node.printNode())
        return json_nodes

    def printNodesRadial(self):
        json_nodes = []
        for node in self.nodes:
            json_nodes.append(node.printNodeRadial())
        return json_nodes

    # Function that prints all edges in a list in JSON-format
    def printEdges(self):
        json_edges = []
        for edge in self.edges:
            json_edges.append(edge.printEdge())
        return json_edges

    # Function that only leaves node with at least 'lim' edges
    # NOT BEING USED RIGHT NOW
    def removeSmallLinks(self, lim):
        # Keep track of nodes to be kept and edges to be removed
        large_nodes = []
        removed_edges = []

        # We only care about nodes with a degree of >= 'lim'
        for node in self.nodes:
            indeg = node.getInDeg()
            outdeg = node.getOutDeg()
            node_id = node.getID()
            # If the in-degree or out-degree is at least 'lim', add the node to the larger nodes
            if indeg >= lim or outdeg >= lim:
                large_nodes.append(node)
            # Otherwise, remove the edges from these smaller nodes
            else:
                for edge in self.edges:
                    if edge.getTarget() == node_id or edge.getSource() == node_id:
                        removed_edges.append(edge)

        # Overwrite the current nodes and edges with the new ones
        self.nodes = large_nodes
        self.edges = [edge for edge in self.edges if edge not in removed_edges]

    def getDoubleEdges(self):
        for edge in self.edges:
            for edge2 in self.edges:
                if edge.getSource() == edge2.getTarget() or edge.getTarget() == edge2.getSource():
                    self.edges.remove(edge2)
                    edge.setDouble(True)

        # for edge in self.edges:
        #     if edge.getDouble():
        #         print(str(edge.getSource()) + ", " + str(edge.getTarget()) + ", " + str(edge.getDouble()))

    # Prints the adjacency list of every node in the graph as a dict
    def printAdjLists(self):
        adj = {}
        for node in self.nodes:
            adj[node.getName()] = node.printAdj()

        return adj

    # Sets the cluster for every node in a list
    def setClusters(self, nodes, cluster):
        for node in nodes:
            node.setCluster(cluster)

    # BFS on graph to find clusters
    def BFS(self, sID, incr):
        s = self.getNode(sID)

        visited = []
        queue = [s]

        while queue:
            node = queue.pop()

            if node not in visited:
                visited.append(node)
                neighbours = node.getAdj()

                for neighbour in neighbours:
                    queue.append(neighbour)

        self.setClusters(visited, incr)

    # Function that resets clusters of all nodes to 0
    def resetClusters(self):
        print("Undoing BFS...")
        self.bfs = False
        for node in self.nodes:
            node.setCluster(0)

    # Applies BFS on the whole graph in a smart manner
    def smartBFS(self):
        print("Using BFS to find clusters...")
        self.bfs = True
        # iterator for clusters
        i = 1

        # Check every node and whether it has been assigned a valid cluster (!= 0)
        for node in self.nodes:
            # If the node has not been assigned a cluster (0)
            if node.getCluster() == 0:
                # Perform BFS on that node and use the cluster iterator to set all of those nodes' cluster to 1
                self.BFS(node.getID(), i)
                # Increase iterator for next cluster
                i += 1

    def printMatrix(self):
        matrix = []
        for i in range(len(self.nodes)):
            matrix.append([])
            for j in range(len(self.nodes)):
                matrix[i].append(0)

        for edge in self.edges:
            matrix[edge.getSource()-1][edge.getTarget()-1] = edge.getVal()

        return matrix

    def printLabels(self):
        labels = []
        for node in self.nodes:
            labels.append(node.getName())

        return labels

    # Returns a dict object of the graph in JSON format
    def printGraph(self):
        print("Making dictionary...")
        dict_graph = {}
        dict_graph["nodes"] = self.printNodes()
        dict_graph["links"] = self.printEdges()
        return dict_graph

    def printOrders(self, df, dict_graph):
        print("Making re-orderings...")

        # The first ordering is the sum-weight order
        weight_sum = reorderBySum(df)
        dict_graph["sum_order"] = weight_sum

        # The second ordering is reverse Cuthill-McKee
        reverse_cuthill_mckee = reverseCuthillMckee(df)
        dict_graph["reverse_cuthill_mckee"] = reverse_cuthill_mckee.tolist()

        # The third ordering is the Cuthill-McKee ordering
        #cuthill_mckee = cuthillMckee(df)
        #dict_graph["cuthill_mckee"] = cuthill_mckee

        # The fourth ordering is the shortest path (Dijkstra) order
        shortest_path = shortestPath(df)
        dict_graph["shortest_path"] = shortest_path

        # The fifth ordering is the amount of unique weights order
        unique_values = uniqueValues(df)
        dict_graph["unique_values"] = unique_values

        mean_values = meanValues(df)
        dict_graph["mean_values"] = mean_values

        #weight_sum2 = weightSum(df)
        #dict_graph["six"] = weight_sum2

        return dict_graph

    def getNodeCount(self):
        return len(self.nodes)

    def getEdgeCount(self):
        return len(self.edges)
