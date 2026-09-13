numbers = [int(i) for i in input("numbers: ").split()]
dictnum = {}
for i in numbers:
    dictnum[i] = dictnum.get(i, 0) + 1
maxcount = 0
mode = None
for k, count in dictnum.items():
    if count > maxcount:
        maxcount = count
        mode = k
print(mode, dictnum)
