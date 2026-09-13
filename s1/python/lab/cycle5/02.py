n = int(input("n: "))
names = []
for i in range(n):
    names.append(input("name: "))
names.sort()
print(*names)
