#include <stdio.h>
#include <stdlib.h>
#define min(a, b) (a > b) ? a : b
int factorial(int n);

void fact(int *n) {
  for (int i = 0; i < 10; i++) {
    *(n + i) = factorial(*(n + i));
  }
}
int main() {
  int a = 4;
  int b = 3;
  printf("%d", min(a, b));
  /*   int *a = malloc(10 * sizeof(int)); */
  /*   for (int i = 0; i < 10; i++) { */
  /*     scanf("%d", (a + i)); */
  /*   } */
  /*   fact(a); */
  /*   for (int i = 0; i < 10; i++) { */
  /*     printf("%d ", *(a + i)); */
  /*   } */
  /*   free(a); */
}

int factorial(int n) {
  if (n <= 0)
    return 1;
  return n * factorial(n - 1);
}
