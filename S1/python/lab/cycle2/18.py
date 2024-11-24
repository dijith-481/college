import math
x= float(input("value of x: "))
n = int(input("terms: "))
sum =0
for i in range(n):
	term = (-1)**i*x**(2*i)/math.factorial(2*i)
	sum +=term
print("sum: ",sum)