height = float(input("initial height: "))
bounciness_index = float(input("bounciness_index"))
n = int(input("n: "))
total = 0
for _ in range(n):
    h = height * bounciness_index
    total += height + h
    height = h
print("total: ", total)
