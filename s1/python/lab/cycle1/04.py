a = int(input("enter first No: "))
b = int(input("enter second No: "))
c = int(input("enter third No: "))
if a >b and a>c:
	largest =a
elif b>a and b>c:
	largest =b
else:
	largest =c
print(f"largest: {largest}")
