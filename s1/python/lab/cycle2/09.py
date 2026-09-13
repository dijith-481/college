import math
num = int(input("number: "))
n =num
krish=0
while n>0:
	krish+= math.factorial(n%10)
	n = n//10
print(num==krish)