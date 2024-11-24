for j in range(1, 1000):
    if j < 2:
        continue
    if j < 4:
        print(j, end="\t")
    else:
        isPrime = True
        for k in range(2, int(j ** (1 / 2) + 1)):
            if j % k == 0:
                isPrime = False
                break
        if isPrime:
            print(j, end="\t")
