import numpy as np

a = np.array([[1, 2], [3, 4]])
w, v = np.linalg.eig(a)
print(w)
print(v)
