num = int(input("number: "))
if 100<= num <=999:
	n=num
	cubeSum=0
	while num>0:
		digit= num%10
		cubeSum+= digit**3
		num//=10
	if n==cubeSum:
		print("ArmStrong Number")
	else:
		print("not ArmStrong Number")
else:
	print("invalid output") 