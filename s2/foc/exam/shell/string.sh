a=hello
b=world

echo ${#a}
c=$a$b
echo $c
echo $(expr substr $a 2 4)
echo ${a:2:4}
echo ${a/ll/}

if [[ $(echo $a | rev) == $a ]]; then
  echo palindrome
else
  echo not palindrome
fi
if [[ $(echo heh | rev) == heh ]]; then
  echo palindrome
else
  echo not palindrome
fi

a=("a" "b" "c" "d")
echo "${a[@]}"
echo "${a[1]}"
a+=("p")
echo "${a[@]}"
echo "${#a[@]}"
unset "a[2]"
echo "${a[@]}"
echo "${#a[@]}"

s="p"
found=0
for i in ${#a[@]}; do
  if [[ ${a[i]} == $s ]]; then
    found=1
    break
  fi
done
if [[ found -eq 1 ]]; then
  echo element found
else
  echo not found
fi
