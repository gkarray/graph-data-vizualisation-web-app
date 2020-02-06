import numpy as np
import string
import itertools
import csv


# Function that creates a random matrix of size (SIZExSIZE) with a chance of 'chance' to have an edge anywhere
# Edge weights are randomly distributed between 0 and 'high'
def randomMatrix(size, chance, high):
    a = list(range(high + 1))
    p = [1-chance]

    for i in range(high):
        p.append(chance/high)

    # We make a random matrix with number 0 to 'high' of size 'size' and probability 'chance' for each number
    matrix = np.random.choice(a, size=(size, size), p=p)
    # We then fill the diagonal of the matrix with zeroes to prevent self-edges
    np.fill_diagonal(matrix, 0)

    return matrix


# Function that exports a matrix directly to a .csv (not very useful)
def exportMatrix(matrix, file):
    print("Exporting to " + file + "...")
    np.savetxt(file, matrix, delimiter=';', fmt="%i")


# Function that creates labels for the nodes (A, B,...,AA, AB,...)
def getNames(size):
    labels = [""]

    for value, label in zip(list(range(size)), product_gen(string.ascii_uppercase)):
        labels.append(label)

    return labels


# Function that generates labels
def product_gen(n):
    for r in itertools.count(1):
        for i in itertools.product(n, repeat=r):
            yield "".join(i)


# Function that (correctly) exports labels and random matrix to a .csv (file)
def exportCSV(file, size, chance, high):
    print("Exporting " + str(size) + "x" + str(size) + " matrix to " + file + "...")
    with open(file, mode='w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file, delimiter=';', )

        csv_writer.writerow(getNames(size))
        for row in np.ndarray.tolist(randomMatrix(size, chance, high)):
            csv_writer.writerow(row + [""])


# To use this script:
#
# Input: [filepath of .csv], [size of matrix], [edge-chance], [high]
# [filepath]: filepath (and name) of exported .csv
# [size]: size of (square) matrix
# [chance]: chance of an entry to be 1 (edge)
# [high]: edge weights between 0 and 'high'
#
# Output: Correctly formatted .csv to be converted to .json

#exportCSV('randomMatrix.csv', 30, 0.05, 5)
