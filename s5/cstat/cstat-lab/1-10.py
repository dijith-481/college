m = {(0, 2): 3, (1, 1): 5, (2, 0): 7}
print(m)
r = c = 3
for i in range(r):
    for j in range(c):
        print(m.get((i, j), 0), end=" ")
    print()
