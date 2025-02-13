#include <stdio.h>
int main() {
  int x, y, r, value;
  scanf("%d%d%d", &x, &y, &r);
  value = r * r - (x * x + y * y);
  if (value > 0)
    printf("inside circle\n");
  else if (value == 0)
    printf("on circle\n");
  else
    printf("outside circle\n");
}
