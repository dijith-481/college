n=int(input("Enter number: "))
isPrime=False
if n<2:
	isPrime=False
elif n<4:
	isPrime =True
elif n%2==0 or n%3==0:
	isPrime =False
else:
	isPrime=True
	i =5
	while i*i <=n:
		if n%i ==0 or n%(i+2)==0:
			isPrime =False
			break
		i+=6
if isPrime:
	print(n,"is Prime")
else:
	print(n,"is not Prime")