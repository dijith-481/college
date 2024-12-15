def mergesort(arr):
    print("current arr: ", arr)
    input()
    n = len(arr)
    if n <= 1:
        return arr
    m = n // 2
    print("sorting left")
    left = mergesort(arr[:m])
    print("sorting right")
    right = mergesort(arr[m:])
    return merge(left, right)


def merge(l, r):
    print("merging: ", l, r)
    nl, nr = len(l), len(r)
    merged = [None] * (nl + nr)
    i = j = k = 0
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
        i += 1
        k += 1
    while j < nr:
        merged[k] = r[j]
        j += 1
        k += 1
    print("merge completed: ", merged)
    input()
    return merged


print(mergesort([2, 5, 8, 3, 6]))
