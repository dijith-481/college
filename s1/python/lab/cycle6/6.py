def dvdndcnqr_majority(arr):
    n = len(arr)
    if n == 1:
        return arr[0]
    m = n // 2
    left_arr = arr[:m]
    right_arr = arr[m:]
    left_maj = dvdndcnqr_majority(left_arr)
    right_maj = dvdndcnqr_majority(right_arr)
    if left_maj == right_maj:
        return left_maj
    left_count = arr.count(left_maj)
    right_count = arr.count(right_maj)
    if left_count > m:
        return left_maj
    if right_count > m:
        return right_maj
    return None


arr1 = [3, 3, 4, 2, 4, 4, 2, 4, 4]
arr5 = [2, 2, 1, 1, 1, 2, 2]
print(dvdndcnqr_majority(arr5))
