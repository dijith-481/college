string = input("string: ")
vowels = "aeiouAEIOU"
newStr=''
for char in string :
	if not char in vowels:
		newStr +=char
print(newStr)