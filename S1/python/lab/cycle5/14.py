def recursiveMax(arr):
    if len(arr) == 1:
        return arr[0]
    maximum = recursiveMax(arr[1:])
    return maximum if maximum > arr[0] else arr[0]


numbers = [int(n) for n in input("numbers: ").split()]
print(recursiveMax(numbers))
