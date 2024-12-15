n = int(input("enter n: "))
nums = []
for i in range(n):
    nums.append(int(input(f"number {i+1}: ")))
print("min: ", min(nums))
print("max: ", max(nums))
print("sum: ", sum(nums))
print("avg: ", sum(nums) / n)
