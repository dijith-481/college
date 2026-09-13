import numpy as np

a = np.array([[1, 2], [3, 4]], dtype=float)
q, r = np.linalg.qr(a)
print(q)
print(r)
