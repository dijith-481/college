import math

num = int(input("number: "))
n = num
sum = 0
while n > 0:
    sum += math.factorial(n % 10)
    n = n // 10
print(num == sum)
