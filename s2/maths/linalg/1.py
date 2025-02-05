import numpy as np

a = 4
b = 3
arr = np.array([[1, 1, 1, 6], [1, 2, 3, 10], [1, 2, a, b], [0, 0, 0, 0]])
arr[1] -= arr[0]
arr[2] -= arr[0]
print(arr)
arr[2] -= arr[1]
print(arr)
