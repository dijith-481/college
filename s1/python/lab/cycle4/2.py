def sum_bound(l, u):
    total = 0
    for i in range(l, u + 1):
        total += i
    return total


print(sum_bound(4, 8))
