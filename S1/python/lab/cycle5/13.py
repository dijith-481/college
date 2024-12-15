def recursiveSum(arr):
    if len(arr) == 0:
        return 0
    return arr[0] + recursiveSum(arr[1:])


numbers = [int(n) for n in input("numbers: ").split()]
print(recursiveSum(numbers))
