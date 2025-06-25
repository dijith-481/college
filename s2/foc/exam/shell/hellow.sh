#!/bin/bash
echo hello

a=5
b=4
echo $(($1 + $2))
if [[ $((a % 2)) -eq 0 ]]; then
  echo even
else
  echo odd
fi
fact=1
while [[ $b -gt 1 ]]; do
  fact=$((fact * b))
  b=$((b - 1))
done
echo $fact

echo $(($1 + $2))
echo $(($1 - $2))
echo $(($1 * $2))
echo $(($1 / $2))

b=4
echo select operation
echo a for addition s for substract m for multiply d for divide
read o
r=0
echo $o
case $o in
a)
  r=$((a + b))
  ;;
s)
  r=$((a - b))
  ;;
m)
  r=$((a * b))
  ;;
d)
  r=$((a / b))
  ;;
esac
echo $r

function factorial() {
  if [[ $1 -eq 1 ]]; then
    echo $1
  else
    echo $(($1 * $(factorial $(($1 - 1)))))
  fi
}
factorial 5

while true; do
  echo enter choice
  echo d for date l for list g for directory e for exit
  read choice
  case $choice in
  d)
    date
    ;;
  l) ls -l ;;
  g)
    pwd
    ;;
  e) exit ;;
  esac
done
