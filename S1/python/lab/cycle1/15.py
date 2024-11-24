mark = int(input("enter mark in 100: "))
if mark >90:
	print("Grade = S")
	print("Grade Point = 10")
elif mark >85:
	print("Grade = A+")
	print("Grade Point = 9.0")
elif mark >80:
	print("Grade = A")
	print("Grade Point = 8.5")
elif mark >75:
	print("Grade = B+")
	print("Grade Point = 8.0")
elif mark >70:
	print("Grade = B")
	print("Grade Point = 7.5")
elif mark >65:
	print("Grade = C+")
	print("Grade Point = 7.0")
elif mark >60:
	print("Grade = C")
	print("Grade Point = 6.5")
elif mark >55:
	print("Grade = D")
	print("Grade Point = 6.0")
elif mark >50:
	print("Grade = Pass")
	print("Grade Point = 5.5")
else:
	print("failed")