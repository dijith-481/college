string = input("enter a string: ")
reverseString = string[::-1]
if string == reverseString:
	print(f"{string} is palindrome")
else:
	print(f"{string} is not palindrome")