import random


def hatsimulation(n, simulation):
    count = 0
    for i in range(simulation):
        hats = list(range(n))
        random.shuffle(hats)
        count += sum(1 for j in range(n) if hats[j] == j)
    count /= simulation
    return count


print(hatsimulation(100, 100000))
