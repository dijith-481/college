def is_valid_no(n):
    if len(n) != 10:
        return False
    if n[0] not in "789":
        return False
    return True


print(is_valid_no("5443543454"))
print(is_valid_no("9443543454"))
