def mergesort(arr):
    n = len(arr)
    if n <= 1:
        return arr
    m = n // 2
    left = mergesort(arr[:m])
    right = mergesort(arr[m:])
    return merge(left, right)


def merge(l, r):
    nl, nr = len(l), len(r)
    i = j = k = 0
    merged = [None] * (nl + nr)
    while i < nl and j < nr:
        if l[i] < r[j]:
            merged[k] = l[i]
            i += 1
        else:
            merged[k] = r[j]
            j += 1
        k += 1
    while i < nl:
        merged[k] = l[i]
        k += 1
        i += 1
    while j < nr:
        merged[k] = r[j]
        k += 1
        j += 1
    return merged


l = [3, 4, 2, 4, 8, 3, 75, 32, 4, 6, 853, 675, 24, 873, 23, 67, 34, 6, 8945]
print(mergesort(l))
