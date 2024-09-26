num = int(input("number: "))
s=0
while num >0:
    digit = num%10
    if not digit % 2:
        s+= digit
    num//=10
print("sum of even digits: ",s)

