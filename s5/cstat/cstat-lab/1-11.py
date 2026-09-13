t = open("sample.txt").read()
print(
    "Words:",
    len(t.split()),
    "\nSentences:",
    t.count(".") + t.count("?") + t.count("!"),
    "\nUpper:",
    sum(1 for c in t if c.isupper()),
    "\nLower:",
    sum(1 for c in t if c.islower()),
    "\nSpecial:",
    sum(1 for c in t if not c.isalnum() and not c.isspace()),
)
