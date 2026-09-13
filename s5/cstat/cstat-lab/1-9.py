n = int(input("Enter n: "))


def f(x):
    return x if x <= 1 else f(x - 1) + f(x - 2)


print(f(n))
