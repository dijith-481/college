name = input("name: ")
total =0
for i in range(6):
    total += float(input(f"subject {i+1}'s mark: "))
print("Total: ",total)
print("Average: ",total/6)
print("percentage: ",total/6)
