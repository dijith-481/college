choice = input("convert to celsius (C) or Fahrenheit(F)? ").upper()
if choice == "C":
	f = float(input("Enter temperature in Fahrenheit: "))
	c= (f-32)*5/9
	print(f"celsius: {c}")
elif choice == "F":
	c = float(input("Enter temperature in celsius: "))
	f= c*9/5 +32
	print(f"fahrenheit: {f}")
else:
	print("invalid choice")