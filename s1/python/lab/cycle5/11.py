n = int(input("n: "))
list1 = []
dict1 = {}
for i in range(n):
    word = input("word: ")
    list1.append(word)
    dict1[word] = len(word)
list1.sort(key=len)
for k in list1:
    print(k, dict1[k])
