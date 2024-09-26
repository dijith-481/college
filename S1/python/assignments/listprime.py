n =100
#initialize a list of size n+1
primes = [True]*(n+1)
#set 0 and 1 to false since both of them are not prime
primes[0]=primes[1] =False
# iterate from 2 to sqrt(n)
# if primes is true then set 
# all of its multiple to false
for p in range(2,int(n**(0.5))):
    if primes[p]:
        for i in range(p*p,n+1,p):
            primes[i] = False
print("primes: ",end ="\t")
#iterate and print the primes
for p in range(2,n+1):
    if primes[p]:
        print(p,end="\t")


