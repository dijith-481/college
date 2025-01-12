import random


def monte_carlo_pi(n):
    inside_circle = 0
    for _ in range(n):
        x = random.random()
        y = random.random()
        if x**2 + y**2 <= 1:
            inside_circle += 1
    return inside_circle / n * 4


print(monte_carlo_pi(10000))
