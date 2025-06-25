#include <stdio.h>
int main() {
  int limit;
  printf("enter limit: ");
  scanf("%d", &limit);
  int primes[limit + 1];
  for (int i = 0; i < limit + 1; i++) {
    primes[i] = 1;
  }
  primes[0] = 0, primes[1] = 0;
  for (int i = 2; i * i <= limit; i++) {
    if (primes[i]) {
      for (int j = i * i; j <= limit; j += i) {
        primes[j] = 0;
      }
    }
  }
  for (int i = 0; i <= limit; i++) {
    if (primes[i]) {
      printf("%d ", i);
    }
  }
  printf("\n");
  return 0;
}
