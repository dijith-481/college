#include <stdio.h>
int main() {
  int a, b;
  int sum, diff, prod, quotient, remainder;
  printf("Enter a and b : ");
  scanf("%d%d", &a, &b);
  sum = a + b;
  diff = a - b;
  prod = a * b;
  quotient = a / b;
  remainder = a % b;
  printf("sum: %d\ndifference: %d\nproduct: %d\nquotient: %d\nremainder: %d\n",
         sum, diff, prod, quotient, remainder);
  return 0;
}
