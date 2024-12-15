list1 = []
list2 = []
n1 = int(input("list 1 elements count: "))
n2 = int(input("list 2 elements count: "))
for i in range(n1):
    list1.append(int(input("list 1 number: ")))
for i in range(n2):
    list2.append(int(input("list 2 number: ")))
list3 = list1 + list2
even = sorted([num for num in list3 if num % 2 == 0])
odd = sorted([num for num in list3 if num % 2 == 1])
list3 = even + odd
print(list3)
