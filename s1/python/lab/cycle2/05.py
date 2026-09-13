n = int(input("enter n: "))
i=0
j=1
print(i,end ="\t")
print(j,end ="\t")
while i <=n:
	curr = i+j
	print(curr,end ="\t")
	i=j
	j = curr	
print()