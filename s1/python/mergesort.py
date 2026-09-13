def mergesort(arr: list[int]) -> list[int]:
    n = len(arr)
    if n <= 1:
        return arr
    m = n // 2
    left = mergesort(arr[:m])
    right = mergesort(arr[m:])
    return merge(left, right)


def merge(left, r: list[int]) -> list[int]:
    nl, nr = len(left), len(r)
    merged = [0] * (nl + nr)
    i = j = k = 0
    while i < nl and j < nr:
        if left[i] < r[j]:
            merged[k] = left[i]
            i += 1
        else:
            merged[k] = r[j]
            j += 1
        k += 1
    while i < nl:
        merged[k] = left[i]
        i += 1
        k += 1
    while j < nr:
        merged[k] = r[j]
        j += 1
        k += 1
    return merged


print(mergesort([2, 5, 8, 3, 6]))
