import numpy as np


def create_matrix(nums, m, n):
    return np.array(nums).reshape(m, n)


def rowsteps(matrix: np.array, row, operation, another_row, constant=1):
    matrix[row, :] = matrix[row, :] + (matrix[another_row, :] * operation * constant)
    return matrix


def rowmult(matrix: np.array, row, constant=1):
    matrix[row, :] = matrix[row] * constant
    return matrix


def main():
    m = int(input("m: "))
    n = int(input("n: "))
    nums = [int(x) for x in input("nums: ").split()]
    matrix = create_matrix(nums, m, n)
    print(matrix)
    while True:
        do = input("mult or add")
        if do == "m":
            row, operation, another_row = input(
                "Enter row,operation,another row :"
            ).split()
            constant = eval(input("constant: "))
            operation = 1 if operation == "+" else -1
            matrix = rowsteps(
                matrix.copy(), int(row) - 1, operation, int(another_row) - 1, constant
            )
        else:
            row = int(input("row: "))
            constant = eval(input("constant: "))
            rowmult(matrix, row, constant)
        print(matrix)


main()
