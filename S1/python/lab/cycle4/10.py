def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


n = int(input("n: "))
for i in range(n):
    print(fibonacci(i))
