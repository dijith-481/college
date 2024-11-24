test = input("string: ")
letters =0
digits=0
words=len(test.split())
upperCase=0
lowerCase=0
for char in test:
	if char.isalpha():
		letters+=1
		if char.isupper():
			upperCase+=1
		else:
			lowerCase+=1
	elif char.isdigit():
		digit+=1
print("letters: ",letters)
print("words: ",words)
print("digits: ",digits)
print("uppercase: ",upperCase)
print("lowercase: ",lowerCase)
