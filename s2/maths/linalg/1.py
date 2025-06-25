import numpy as np

a = 4
b = 3
arr = np.array([[7.3, 0.2, -3.7], [-11.3, 1.0, 5.5], [17.7, 1.8, -9.3]])
arr[1] += arr[0] * 11.3 / 7.3
arr[2] -= arr[0] * 17.7 / 7.3
print(arr)
arr[2] -= arr[1]
print(arr)
