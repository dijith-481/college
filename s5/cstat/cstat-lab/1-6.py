s = input("Enter string: ")
v = sum(1 for c in s if c.lower() in "aeiou")
c = sum(1 for c in s if c.isalpha() and c.lower() not in "aeiou")
print(
    "Vowels:", v, "\nConsonants:", c, "\nWords:", len(s.split()), "\n?:", s.count("?")
)
