#include <stdio.h>
int main() {
  int a[] = {1, 2, 3, 4, 5, 6, 7, 8};
  for (int i = 0; i < 8; i++) {
    if (a[i] == 4)
      printf("found");
  }
}
