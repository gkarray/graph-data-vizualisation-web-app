import pandas as pd
from .graphD3 import GraphD3
from .randomMatrix import exportCSV
import json
from datetime import datetime

# v2.9.3: Fixed other filetype import


# This function takes a filename and a delimiter (default: ;) and returns a DataFrame from a .csv
def importCSV(filename, delimiter=';'):
    if type(filename) != str:
        print("Err: filename is not a string")
    else:
        print("Importing csv...")
        # Get a DF from the .csv
        df = pd.read_csv(filename, delimiter=delimiter, index_col=0)
        # We have to fix the column names, we do this quite obscurely
        names = list(df)
        names.append("delet this")
        df.set_axis(names[1:], axis='columns', inplace=True)
        # We then drop the extra NaN column
        df.drop(["delet this"], axis='columns', inplace=True)
        return df


def importCSV2(file_path):
    df = pd.read_csv(file_path, delimiter=';')
    cols = list(df.columns)
    rows = list(df)

    if rows[1].isdigit():
        print("DIGIT CHECK")
        df = pd.read_csv(file_path, delimiter=';', index_col=0)

    else:
        cols = [name.replace("_", " ") for name in cols]
        rows = [name.replace("_", " ") for name in rows]

        cols.append("delet this")
        df.set_axis(cols[1:], axis='columns', inplace=True)
        df.set_axis(rows[1:], axis='rows', inplace=True)
        df.drop(["delet this"], axis='columns', inplace=True)

    return df


# This function prints nodes from a list of Node objects
def getNodes(ls):
    all_nodes = []
    # Iterate through all nodes and print the ID and label
    for node in ls:
        current_node = []
        current_node.append(node.getID())
        current_node.append(node.getLabel())
        all_nodes.append(current_node)
    return all_nodes


# This function prints edges from a list of Edge objects and an optional edge ID
def getEdges(ls, id=-1):
    all_edges = []
    # If the ID given is -1 (default), print all edges
    if id == -1:
        for edge in ls:
            current_edge = []
            current_edge.append(edge.getID())
            current_edge.append(edge.getLoc())
            all_edges.append(current_edge)
    # Otherwise print the edges for which "from" = ID
    else:
        for edge in ls:
            if edge.getFrom() == id:
                current_edge = []
                current_edge.append(edge.getID())
                current_edge.append(edge.getLoc())
                all_edges.append(current_edge)
    return all_edges


# Function that outputs the 'graph' dictionary as a .json file
def jsonOut(graph, filename):
    print("Converting graph to .json...")
    with open(filename, 'w') as outfile:
        json.dump(graph, outfile)#, indent=2)
        outfile.close()


# Function that clears the df, graph and dict_graph just to be safe
def clearData(df, graph, dict_graph):
    del df
    del graph
    del dict_graph


# Function that takes an input & output and makes a .json file representing the graph
def convertGraph(file_path, output='output', BFS='y'):
    startTime = datetime.now()
    df = importCSV2(file_path)
    print("Creating graph with nodes and edges...")
    graph = GraphD3()
    graph.addNodes(df)
    graph.addEdges(df)
    graph.setNodeCoordinates()
    if BFS.lower() == 'y' or BFS.lower() == 'yes':
        graph.smartBFS()
    dict_graph = graph.printGraph()
    dict_graph_ordered = graph.printOrders(df, dict_graph)
    jsonOut(dict_graph_ordered, output)
    endTime = datetime.now() - startTime
    print("Output success! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))
    clearData(df, graph, dict_graph)
    return {"edges": graph.getEdgeCount(), "nodes": graph.getNodeCount()}

def convertJson(file_path, output='output', BFS='n'):
    startTime = datetime.now()
    print("Opening .json...")
    with open(file_path, 'r') as f:
        data = json.load(f)

    # data is a dict with "nodes" and "links"
    # data["nodes"] has a list of node dicts
    # data["links"] has a list of edge dicts
    print("Creating graph with nodes and edges...")
    graphJson = GraphD3()
    graphJson.addNodesFromDict(data["nodes"])
    graphJson.addEdgesFromDict(data["links"])
    if BFS.lower() == 'r' or BFS.lower() == 'reset':
        graphJson.resetClusters()
    elif BFS.lower() == 'y' or BFS.lower() == 'yes':
        graphJson.smartBFS()
    dict_graphJson = graphJson.printGraph()
    jsonOut(dict_graphJson, output)
    endTime = datetime.now() - startTime
    print("Output success! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))


def generateRandomMatrix(file, size, chance, high):
    exportCSV(file, size, chance, high)

# To run this script:
#
# Input: [filepath of input.csv], [output.json], [BFS]
# [filepath]: filepath of the .csv
# [output.json]: name of output .json file (with .json)
# BFS: if you want to use BFS to identify clusters and color them separately ['y' or 'n']
#
# Output: [output.json] as a graph with nodes and edges from the .csv

#generateRandomMatrix('randomMatrix.csv', 200, 0.007, 10)
#convertGraph('randomMatrix.csv', 'randomMatrix.json', 'y')
#convertJson('C:\\path', 'output.json', 'y')
