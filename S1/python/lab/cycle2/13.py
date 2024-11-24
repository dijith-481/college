string = input("enter String: ")
vowels = "aeiouAEIOU"
vowelCount=0
for char in string:
	if char in vowels:
		vowelCount+=1
print("vowel Count= ",vowelCount)