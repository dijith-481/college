#include <stdio.h>
int main() {
  int n;
  printf("Enter number: ");
  scanf("%d", &n);
  if (n % 2)
    printf("%d is odd\n", n);
  else
    printf("%d is even\n", n);
  return 0;
}
