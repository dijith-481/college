#include <stdio.h>
int recursiveGcd(int a, int b) {
  if (b == 0) {
    return a;
  }
  return recursiveGcd(b, a % b);
}
int main() {
  int a, b;
  printf("enter a number : ");
  scanf("%d", &a);
  scanf("%d", &b);
  printf("gcd %d\n", recursiveGcd(a, b));
}
