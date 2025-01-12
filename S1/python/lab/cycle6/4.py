def maxarr(arr):
    n = len(arr)
    if n == 1:
        return arr[0]
    m = n // 2
    maxleft = maxarr(arr[:m])
    maxright = maxarr(arr[m:])
    return maxleft if maxleft > maxright else maxright


list1 = [2, 3, 4, 5, 3, 2, 1, 2, 34, 6, 7, 9, 78, 6, 4, 3, 2, 34]
print(maxarr(list1))
