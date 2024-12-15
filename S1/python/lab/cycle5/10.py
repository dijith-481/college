def isPrime(n):
    if n <= 1:
        return False
    for i in range(2, int(n ** (1 / 2)) + 1):
        if n % i == 0:
            return False
    return True


list1 = [int(x) for x in input("numbers: ").split()]
primelist = []
composite = []
for i in list1:
    if isPrime(i):
        primelist.append(i)
    else:
        composite.append(i)
print("prime", *primelist)
print("composite", *composite)
