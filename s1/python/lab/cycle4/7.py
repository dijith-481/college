def add(x, y):
    if y == 0:
        return x
    else:
        return add(x + 1, y - 1)


print(add(5, 4))
print(add(6, 3))
