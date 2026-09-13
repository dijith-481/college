a = float(input("a: "))
b = float(input("b: "))
c = float(input("c: "))
d = b**2 - (4*a*c)
if d>=0:
	x1 =(-b-(d**(0.5)))
	x2 =(-b+(d**(0.5)))
	print(f"the roots are {x1}, {x2}")
else:
	real = -b/(2*a)
	imaginary = abs(d)**0.5 /(2*a)
	print(f"root 1 : {real}- {imaginary}i")
	print(f"root 1 : {real}+ {imaginary}i")
	print("they are complex")