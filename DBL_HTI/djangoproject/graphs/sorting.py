def QuickSort(A, lo, hi, index):
    if lo < hi:
        p = partition(A, lo, hi, index)
        QuickSort(A, lo, p - 1, index)
        QuickSort(A, p + 1, hi, index)

def partition(A, lo, hi, index):
    pivot = A[hi]
    i = lo
    for j in range(lo, hi):
        if A[j] < pivot:
            A[i], A[j] = A[j], A[i]
            index[i], index[j] = index[j], index[i]
            i += 1
    A[i], A[hi] = A[hi], A[i]
    index[i], index[hi] = index[hi], index[i]
    return i


def InsertionSort(A, index):
    i = 1
    while i < len(A):
        j = i
        while j > 0 and A[j-1] > A[j]:
            A[j], A[j-1] = A[j-1], A[j]
            index[j], index[j-1] = index[j-1], index[j]
            j = j - 1
        i = i + 1