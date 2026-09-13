str = input("string ")
strdict = {}
for char in str:
    if char in strdict:
        strdict[char] += 1
    else:
        strdict[char] = 1
for key, value in strdict.items():
    print(key, ": ", value)
