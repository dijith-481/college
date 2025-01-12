def brute_stringmatch(string, pattern):
    strlen = len(string)
    patternlen = len(pattern)
    for i in range(strlen - patternlen):
        if string[i : i + patternlen] == pattern:
            return True
    return False


string = "helloWorld"
pattern = "oW"
pattern1 = "ow"
print(brute_stringmatch(string, pattern))
print(brute_stringmatch(string, pattern1))
