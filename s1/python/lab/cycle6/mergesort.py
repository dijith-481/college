def mergesort(arr):
    n = len(arr)
    if n <= 1:
        return arr
    m = n // 2
    left = mergesort(arr[:m])
    right = mergesort(arr[m:])
    return merge(left, right)


def merge(l, r):
    merged = []
    while l and r:
        if l[0] < r[0]:
            merged.append(l.pop(0))
        else:
            merged.append(r.pop(0))
    return merged + l + r


list1 = [3, 4, 2, 4, 8, 3, 75, 32, 4, 6, 853, 675, 24, 873, 23, 67, 34, 6, 8945]
print(mergesort(list1))
