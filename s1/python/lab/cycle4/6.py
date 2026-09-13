def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n - 1)


n = int(input("n: "))
r = int(input("r: "))
ncr = factorial(n) // (factorial(r) * factorial(n - r))
npr = factorial(n) // factorial(n - r)
print("ncr", ncr)
print("npr", npr)
