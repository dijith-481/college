def mult(x, y):
    if y == 0:
        return x
    if y == 1:
        return x
    return x + mult(x, y - 1)


print(mult(8, 6))
print(mult(4, 3))
