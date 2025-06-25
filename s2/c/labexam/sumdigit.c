#include <stdio.h>
int main() {
  int n = 15353535;
  int sum = 0;
  while (n) {
    sum += n % 10;
    n /= 10;
  }
  printf("%d", sum);
}
