s = input("Enter brackets: ")
st = []
m = {")": "(", "}": "{", "]": "["}
v = True
for c in s:
    if c in "({[":
        st.append(c)
    elif c in ")}]":
        if not st or st.pop() != m[c]:
            v = False
            break
if st:
    v = False
print("Valid" if v else "Invalid")
