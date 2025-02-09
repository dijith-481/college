#include <stdio.h>
int main() {
  int n;
  printf("Enter number: ");
  scanf("%d", &n);
  if (!(n % 3 || n % 5))
    printf("%d is  divisible by 3 and 5\n", n);
  else
    printf("%d is not divisible by 3 and 5\n", n);
  return 0;
}
