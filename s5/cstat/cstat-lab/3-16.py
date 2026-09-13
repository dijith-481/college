import numpy as np

n = int(input("Enter n: "))
phi = (1 + np.sqrt(5)) / 2
psi = (1 - np.sqrt(5)) / 2
f = [(phi**i - psi**i) / np.sqrt(5) for i in range(n)]
print(np.round(f).astype(int))
