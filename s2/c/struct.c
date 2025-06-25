#include "stdio.h"

struct P {
  int a;
  int b;
  char c;
};
int main() {
  struct P a;
  a.a = 1;
  a.b = 2;
  a.c = 'a';
  printf("%d%d%c", a.a, a.b, a.c);
}
