#!/bin/bash
add() {
  echo "sum=$(($1 + $2))"
}
subtract() { echo "diff=$(($1 - $2))"; }
multiply() { echo "prod=$(($1 * $2))"; }
divide() {
  if [ $2 -ne 0 ]; then
    echo "quo=$(($1 / $2))"
  else
    echo "division by 0 not possible"
  fi
}
echo "1. add"
echo "2.subtract"
echo "3. multiply"
echo "4. divide"
read -p "enter choice: " choice
read -p "no. 1: " a
read -p "no. 2: " b
case $choice in
1) add $a $b ;;
2) subtract $a $b ;;
3) multiply $a $b ;;
4) divide $a $b ;;
*) echo "enter valid choice" ;;
esac
