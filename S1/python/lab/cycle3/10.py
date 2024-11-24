n = int(input("number: "))
largest = 0
while n > 0:
    modulus = n % 10
    if modulus > largest:
        largest = modulus
    n //= 10
print(largest)
