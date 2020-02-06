import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import reverse_cuthill_mckee, dijkstra
from .sorting import QuickSort
from datetime import datetime

import sys
sys.setrecursionlimit(1500)


# Reorders the df by sum of row/column
def reorderBySum(df):
    startTime = datetime.now()
    print("    Calculating weight-sum ordering...")
    # We make a copy of the dataframe as to not change the original dataframe
    df_sum = df.copy()

    # Add row & column with sum of weights
    df_sum.loc['rowSum'] = df_sum.sum(axis=0)
    df_sum['colSum'] = df_sum.sum(axis=1)

    # Sort row & column by sum of weights
    df_sum = df_sum.sort_values(df_sum.last_valid_index(), axis=1)
    df_sum = df_sum.sort_values(['colSum'])

    # Save the new orders as a list
    rowOrder = list(df_sum.index)
    colOrder = list(df_sum)

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    # Return the list (minus the sum row/column)
    return rowOrder[:-1], colOrder[:-1]


# Reorders the df by amount of unique weights
def uniqueValues(df):
    startTime = datetime.now()
    print("    Calculating unique values ordering...")
    # We make a copy of the dataframe as to not change the original dataframe
    df_unique = df.copy()

    # Add row & column with amount of unique weights
    df_unique.loc['uniqueRow'] = df.nunique(0)
    df_unique['uniqueCol'] = df.nunique(1)

    # Sort row & column by amount of unique weights
    df_unique.sort_values(df_unique.last_valid_index(), axis=1, inplace=True)
    df_unique.sort_values(['uniqueCol'], inplace=True)

    # Save the new orders as a list
    rowOrder = list(df_unique.index)
    colOrder = list(df_unique)

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    # Return the list (minus the unique count row/column)
    return rowOrder[:-1], colOrder[:-1]


# Reorders the df by mean value of each row/column
def meanValues(df):
    startTime = datetime.now()
    print("    Calculating mean values ordering...")
    # We make a copy of the dataframe as to not change the original dataframe
    df_mean = df.copy()

    df_mean.loc['meanRow'] = df.mean(0)
    df_mean['meanCol'] = df.mean(1)

    df_mean.sort_values(df_mean.last_valid_index(), axis=1, inplace=True)
    df_mean.sort_values(['meanCol'], inplace=True)

    rowOrder = list(df_mean.index)
    colOrder = list(df_mean)

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    return rowOrder[:-1], colOrder[:-1]


# Reorders the matrix (symmetrically) with the reverse Cuthill-McKee algorithm
def reverseCuthillMckee(df):
    startTime = datetime.now()
    print("    Calculating reverse Cuthill-McKee ordering...")
    # We first change the DF to a np array
    df_np = df.to_numpy()
    # Which is then converted to a scipy CSR graph
    graph = csr_matrix(df_np)
    # On which the algorithm is run
    graph_ordered = reverse_cuthill_mckee(graph, symmetric_mode=False)
    # We return a list of the ordering (indices)

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    return graph_ordered


# Reorders the matrix based on the shortest path (Dijkstra) to another node
def shortestPath(df):
    startTime = datetime.now()
    print("    Calculating shortest path ordering...")
    #names = list(df)

    # We first get a 2D-array of distances
    df_np = df.to_numpy()
    graph = csr_matrix(df_np)
    graph_distances = dijkstra(graph)
    df_distance = pd.DataFrame(graph_distances)

    # We make dataframe and replace all infs with 0
    #df_distance.set_axis(names, axis='columns', inplace=True)
    df_distance.replace(np.inf, 0, inplace=True)

    df_distance.loc['rowSum'] = df_distance.sum(axis=0)
    df_distance['colSum'] = df_distance.sum(axis=1)

    df_distance.sort_values(df_distance.last_valid_index(), axis=1, inplace=True)
    df_distance.sort_values(['colSum'], inplace=True)

    rowOrder = list(df_distance.index)
    colOrder = list(df_distance)

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    return rowOrder[:-1], colOrder[:-1]


def cuthillMckee(df):
    startTime = datetime.now()
    print("    Calculating Cuthill-McKee ordering...")
    # We load the df as a matrix object
    matrix = loadDF(df)
    # We then make an algorithm object
    algo = Algorithm(matrix)
    # We run the Cuthill-McKee algorithm on 'algo'
    algo.cuthill_mckee()
    # Then we retrieve the row and column order
    rowOrder = matrix.get_rows()
    colOrder = matrix.get_cols()

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    return rowOrder, colOrder


def weightSum(df):
    startTime = datetime.now()
    print("    Calculating 2nd weight-sum ordering...")
    matrix = loadDF(df)
    algo = Algorithm(matrix)
    algo.sum_order()

    rowOrder = matrix.get_rows()
    colOrder = matrix.get_cols()

    endTime = datetime.now() - startTime
    print("    Done! (%s.%s seconds)" % (endTime.seconds, endTime.microseconds))

    return rowOrder, colOrder


def loadDF(df):
    # Matrix(2D-array of values, col-indices, row-indices, size)

    # print("DF: " + str(df.to_numpy().tolist()))

    matrix = df.to_numpy().tolist()
    size = len(list(df))
    rows = list(range(size))
    cols = list(range(size))

    matrix = Matrix(matrix, rows, cols, size)

    # print("Matrix: " + str(matrix.get_matrix()))

    return matrix


class Matrix:
    # matrix is an adj matrix
    # row and col are row and column labels
    # size is the n x n size of the matrix
    def __init__(self, matrix=[], col=[], row=[], size=0, degree=[]):
        self.matrix = matrix
        self.col = col
        self.row = row
        self.size = size
        self.degree = degree

    # sets the degrees of all nodes
    def make_degree(self):
        self.degree = []
        i = 0
        for item in self.matrix:
            self.degree.append(num(item))
    
    # tranposes the matrix.
    # so basically matrix[i][j] = matrix[j][i]
    def transpose(self, deg = False):
        for i in range(self.size):
            for j in range(i, self.size):
                self.matrix[i][j], self.matrix[j][i] = self.matrix[j][i], self.matrix[i][j]
        
        self.row, self.col = self.col, self.row

        if deg:
            self.make_degree()

    # prints the matrix in CSV format
    def print_(self):
        new = ['']
        for i in range(self.size):
            new[0] += ';' + str(self.col[i])
            new.append(str(self.row[i]) + ';')
            for j in range(self.size):
                new[i+1] += str(self.matrix[i][j]) + ';'
        
        return [[item] for item in new]
    
    # makes a matrix based on graph data
    def set_matrix(self, graph):        
        matrix = []
        for i in range(self.size):
            matrix.append([])
            for j in range(self.size):
                matrix[i].append(0)

        for item in graph:
            matrix[item['source']][item['target']] = item['value']
        
        self.matrix = matrix
    
    def reset_index(self):
        self.row = list(range(self.size))
        self.col = list(range(self.size))
    
    def set_rows(self, rows):
        self.row = rows
    
    def set_cols(self, cols):
        self.col = cols
    
    def set_size(self, size):
        self.size = size

    def get_matrix(self):
        return self.matrix
    
    def get_degrees(self):
        return self.degree
    
    def get_degree(self, i):
        return self.degree[i]

    def get_rows(self):
        return self.row

    def get_cols(self):
        return self.col
    
    def get_size(self):
        return self.size


class Algorithm:
    # matrix is a Matrix object
    def __init__(self, matrix):
        self.matrix = matrix
    
    # reorders each and every row
    # uses that order to reorder the matrix
    # does the same thing for the columns
    def cuthill_mckee(self):
        # index_row = self.weight_row()
        # index_col = self.weight_row()
        self.matrix.make_degree()
        index_row = self.new_cuthill([])
        self.matrix.transpose(True)
        index_col = self.new_cuthill([])
        self.matrix.transpose()

        self.matrix.set_rows(index_row)
        self.matrix.set_cols(index_col)
    
    # uses the sum of weights in each row to order the matrix
    # does the same for the columns
    def sum_order(self):
        index_row = self.weight_sum()
        index_col = self.weight_sum()

        self.matrix.set_row(index_row)
        self.matrix.set_col(index_col)
    
    # uses the number of non zero weights in each row to order the matrix
    # does the same for the columns
    def num_order(self):
        index_row = self.weight_num()
        index_col = self.weight_num()

        self.matrix.set_row(index_row)
        self.matrix.set_col(index_col)
    
    # ordering by number of non-zero weights
    def weight_num(self):
        num_list = []
        
        # appends the number of weights in each row to num_list
        for row in self.matrix.get_matrix():
            num_list.append(num(row))
        
        # makes an index representing the order of num_list
        index = list(range(self.matrix.get_size()))
        QuickSort(num_list, 0, self.matrix.get_size()-1, index)
        self.matrix.transpose()
        
        return index
    
    # ordering by the sum of weights
    def weight_sum(self):
        sum_list = []
        
        # appends the weight sums of each row into sum_list
        for row in self.matrix.get_matrix():
            sum_list.append(sum(row))
        
        # makes an index representing the order of sum_list
        index = list(range(self.matrix.get_size()))
        QuickSort(sum_list, 0, self.matrix.get_size()-1, index)
        self.matrix.transpose()
        
        return index
    
    # orders based on the sorted weights of each individual row
    def weight_row(self):
        size = self.matrix.get_size()
        matrix = self.matrix.get_matrix()

        for i in range(size):
            # makes index based on the current row
            index = list(range(size))
            QuickSort(matrix[i][:], 0, size-1, index)

            # uses index to reorder the matrix
            # self.matrix.new_order(index)
        self.matrix.transpose()
        
        return index
    
    # improved cuthill algorithm
    # still needs to be tested
    def new_cuthill(self, R):
        Q = []
        v = self.minDegree(R)
        R.append(v)
        adj = self.adjacent(v, R)
        Q = Q + self.sortByDegree(adj)

        while Q:
            v = Q.pop(0)
            if v not in R:
                R.append(v)
            adj = self.adjacent(v, R)
            adj = self.sortByDegree(adj)
            for i in adj:
                if i not in Q:
                    Q.append(i)

        if len(R) < self.matrix.get_size():
            R = self.new_cuthill(R)
        
        return R
    
    # finds the minimal degree in the adjacency matrix
    # excludes any elements found in R
    def minDegree(self, R):
        degrees = self.matrix.get_degrees()

        for item in R:
            degrees.pop(item)
        
        minimum = min(degrees)
        
        return degrees.index(minimum)
    
    # retrieves the adjacency list for v
    # excludes any elements contained in R
    def adjacent(self, v, R = []):
        result = []
        
        i = 0
        for item in self.matrix.get_matrix()[v]:
            if item > 0 and i not in R:
                result.append(i)
            i += 1
        
        return result
    
    # sorts the given adjacency list in increasing order of degree
    def sortByDegree(self, adj):
        degree_list = []

        for item in adj:
            degree_list.append(self.matrix.get_degree(item))
        
        QuickSort(degree_list, 0, len(adj)-1, adj)

        return adj

# counts the number of non-zero weights
def num(row):
    count = 0
    for item in row:
        count += (item != 0)

    return count