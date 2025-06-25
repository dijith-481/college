#include <stdio.h>
int sumarr(int a[], int n) {
  if (!n)
    return 0;
  return a[n - 1] + sumarr(a, n - 1);
}
int main() {
  /* printf("enter a number: "); */
  int n = 10;
  int a[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 0};
  /* scanf("%d", &a); */
  int f = sumarr(a, n);
  printf("%d\n", f);
}
