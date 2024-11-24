n = int(input("enter n: "))
i, j = 0, 1
if n < 1:
    print()
else:
    while i <= n:
        print(i, end="\t")
        i, j = j, i + j
    print()
