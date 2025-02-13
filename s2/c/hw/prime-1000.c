#include <stdio.h>
int main() {
  for (int i = 2; i < 1000; i++) {
    int is_prime = 1;
    int j = 2;
    while (j * j <= i && is_prime) {
      if (i % j == 0)
        is_prime = 0;
      j++;
    }
    if (is_prime)
      printf("%d\t", i);
  }
  printf("\n");
}
