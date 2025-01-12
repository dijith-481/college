def passwordcrack(password):
    for i in range(1000):
        current = f"{i:3}"
        if current == password:
            return current


passwd = "456"
print(passwordcrack(passwd))
