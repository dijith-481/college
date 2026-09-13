n = int(input("enter number of numbers: "))
i=sum=largest=0
smallest =float("inf")
while i<n:
	num = int(input(f"enter {i+1}th number: "))
	largest= max(largest,num)
	smallest= min(smallest,num)
	sum+= num 
	i+=1
print(f"sum = {sum}")
print(f"average = {sum/n}")
print(f"largest = {largest}")
print(f"smallest = {smallest}")
	