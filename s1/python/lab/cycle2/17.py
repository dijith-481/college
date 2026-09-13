def dectoBin(n):
	if n ==0:
		return "0"
	binary = ""
	while n>0:
		binary = str(n%2)+binary
		n//=2
	return binary
def BintoDec(n):
	power=0
	decimal=0
	for i in range(len(n)-1,-1,-1):
		if n[i]=="1":
			decimal+=2**power
		power+=1
	return decimal
choice = input("choose option d for decimal to binary and b for binary to decimal")
if choice == "d":
	decimal = int(input("number: "))
	binary = dectoBin(decimal)
	print(binary)
elif choice == "b":
	print(BintoDec(input("number: ")))