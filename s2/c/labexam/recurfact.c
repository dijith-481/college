#include <stdio.h>
unsigned long long int fact(unsigned long long int n) {
  if (n <= 1) {
    return 1;
  }
  return n * fact(n - 1);
}
int main() {
  printf("enter a number: ");
  int a;
  scanf("%d", &a);
  unsigned long long int f = fact(a);
  printf("%llu\n", f);
}
