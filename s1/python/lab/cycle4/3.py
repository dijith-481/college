def is_right(s1, s2, s3):
    s1 *= s1
    s2 *= s2
    s3 *= s3
    if s1 + s2 == s3 or s1 + s3 == s2 or s2 + s3 == s1:
        return True
    else:
        return False


print(is_right(3, 4, 5))
