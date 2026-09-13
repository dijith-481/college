import numpy as np

a = np.arange(27).reshape(3, 3, 3)
print(a)
print(a.diagonal(axis1=1, axis2=2))
