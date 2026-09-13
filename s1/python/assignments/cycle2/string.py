# Program demonstrating string methods

data = "Python rules!"

# a. Convert to uppercase
uppercase_data = data.upper()
print("Uppercase:", uppercase_data)

# c. Locate "rules"
rules_position = data.find("rules")
print("Position of 'rules':", rules_position)

# d. Replace "!" with "?"
modified_data = data.replace("!", "?")
print("Modified string:", modified_data)
# Program for decimal to binary and binary to decimal conversion (without built-in functions)


# Decimal to Binary
def decimal_to_binary(decimal_num):
    if decimal_num == 0:
        return "0"
    binary = ""
    while decimal_num > 0:
        remainder = decimal_num % 2
        binary = str(remainder) + binary  # Prepend the remainder
        decimal_num //= 2
    return binary


# Binary to Decimal
def binary_to_decimal(binary_str):
    decimal = 0
    power = 0
    for i in range(
        len(binary_str) - 1, -1, -1
    ):  # we are reading string in reverse order
        if binary_str[i] == "1":
            decimal += 2**power
        power += 1
    return decimal


# Get input from the user
choice = input("Enter 'd' for decimal to binary or 'b' for binary to decimal: ")

if choice.lower() == "d":
    print(decimal_to_binary(int(input("Enter a decimal number: "))))

elif choice.lower() == "b":
    binary_str = input("Enter a binary number (as a string): ")
    decimal_result = binary_to_decimal(binary_str)
    print("Decimal equivalent:", decimal_result)

else:
    print("Invalid choice.")
