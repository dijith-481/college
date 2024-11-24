# Program to calculate the sum of the cosine series

import math

x = float(input("Enter the value of x (in radians): "))
n = int(input("Enter the number of terms (n): "))

sum_of_series = 0
for i in range(n):
    term = (-1) ** i * x ** (2 * i) / math.factorial(2 * i)
    sum_of_series += term

print("Sum of cosine series:", sum_of_series)
