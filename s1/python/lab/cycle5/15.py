def recursiveCount(arr, value):
    if len(arr) == 0:
        return 0
    return int(arr[0] == value) + recursiveCount(arr[1:], value)


values = [n for n in input("values: ").split()]
value = input("value: ")
print(recursiveCount(values, value))
