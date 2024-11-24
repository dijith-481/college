import math
n = int(input("n: "))
r = int(input("r: "))
ncr = math.factorial(n)//(math.factorial(r)* math.factorial(n-r))
print("nCr: ",ncr)
