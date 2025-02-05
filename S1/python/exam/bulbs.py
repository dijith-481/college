bulbs = [0] * 501
for i in range(2, 501):
    for j in range(i, 501, i):
        bulbs[j] = (bulbs[j] + 1) % 2
print(sum(bulbs))
