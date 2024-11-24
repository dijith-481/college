str1 = "Hello"
str2 = "World"
compinedString = str1 + " " +str2 # using + operator
compinedString2 = f"{str1} {str2}" #using fstring
print(compinedString)
print(compinedString2)
substring = compinedString[0:5]
reverseString = compinedString[::-1]
print(substring,reverseString)