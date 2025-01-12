def issubset(nums, target):
    n = len(nums)
    for i in range(1 << n):
        subsetsum = 0
        for j in range(n):
            if i & (1 << j):
                subsetsum += nums[j]
        if subsetsum == target:
            return True
    return False


nums = [2, 3, 5, 34, 2, 4, 54, 3]
target = 11
print(issubset(nums, target))
