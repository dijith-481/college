#include <stdio.h>
int main() {
  int num = 32154;
  printf("%d\n", num);
  int f, l = num % 10;
  num /= 10;
  int rev = 0;
  while (num > 0) {
    rev = rev * 10 + num % 10;
    num /= 10;
  }
  f = rev % 10;
  rev /= 10;

  while (rev > 0) {
    l = l * 10 + rev % 10;
    rev /= 10;
  }
  l = l * 10 + f;
  printf("%d", l);
}
