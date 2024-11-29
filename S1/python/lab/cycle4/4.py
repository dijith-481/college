def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True


n = int(input())
i = 0
while i < n:
    if is_prime(i):
        print(i, end="\t")
    i += 1
print()
i = j = 0
while i != n:
    j += 1
    if is_prime(j):
        i += 1
print(j)
