#include <stdio.h>
int main() {
  int a = 0;
  int b = 1;
  for (int i = 0; i < 40; i++) {
    printf("%d\t", a);
    int tmp = a;
    a = b;
    b = tmp + a;
  }
}
