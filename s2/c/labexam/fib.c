#include <stdio.h>
int fib(int n) {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}
void primesieve(int n) {
  int a[n + 1];
  a[0] = a[1] = 0;
  for (int i = 2; i <= n; i++) {
    a[i] = 1;
  }
  for (int i = 0; i * i <= n; i++) {
    if (a[i]) {
      for (int j = i * i; j <= n; j += i) {
        a[j] = 0;
      }
    }
  }
  for (int i = 0; i <= n; i++) {
    if (a[i]) {
      printf("%d\t", i);
    }
  }
}
int main() {
  printf("enter a number: ");
  int a = 1000000;
  /* scanf("%d", &a); */
  primesieve(a);
  /* for (int i = 0; i < a; i++) { */
  /*   printf("%d\t", fib(i)); */
  /* } */
}
