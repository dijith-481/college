binstring = input("enter binary string: ")
bindict = {"0": 0, "1": 0}
for char in binstring:
    bindict[char] += 1
print(bindict)
