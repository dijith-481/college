def password_guess(passwd):
    for i in range(1000):
        current = f"{i:3}"
        if current == passwd:
            return current


print(password_guess("324"))
