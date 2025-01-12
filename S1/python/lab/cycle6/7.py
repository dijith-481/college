def fibonacci(n, memo):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    return fibonacci(n - 1, memo) + fibonacci(n - 2, memo)


def fibonacci_seq(n, memo={}):
    for i in range(n):
        print(fibonacci(i, memo), end="\t")


fibonacci_seq(10)
