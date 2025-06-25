#include "stdio.h"
int main() {
  int a = 5;
  int b = a++ + a++ + a++ + ++a + ++a;
  printf("%d", a);
  printf("%d", b);
}
