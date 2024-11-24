n = int(input("numeber: "))
oddSum = 0
evenSum = 0
for _ in range(n):
	num = int(input("numeber: "))
	if num%2 ==0:
		evenSum+=num
	else:
		oddSum+=num
print("odd Sum: ",oddSum)
print("even Sum: ",evenSum)