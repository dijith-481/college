#include <stdio.h>
#define pi 3.14

int main() {
  printf("enter radius of circle: ");
  int r;
  float area;
  scanf("%d", &r);
  area = pi * r * r;
  printf("area of circle is %.2f\n", area);
  return 0;
}
