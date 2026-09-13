print("choose option")
print("1.Addition")
print("2.substraction")
print("3.multiplication")
print("4.division")
print("5.remainder")
operator = int(input("enter operation number: "))
valilOperators = {1,2,3,4,5}
if operator in valilOperators:
	num1 = float(input("num1: "))
	num2 = float(input("num2: "))
	if operator == 1:
		ans = num1+num2
	elif operator == 2:
		ans = num1-num2
	elif operator == 3:
		ans = num1*num2
	elif operator == 4:
		if num2==0:
			print("invalid division by zero")
		else:
			ans = num1/num2
	elif operator == 5:
		if num2==0:
			print("invalid division by zero")
		else:
			ans = num1%num2
	print("result: ",ans)
else:
	print("invalid operation")
