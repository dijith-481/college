#include <stdio.h>
int main() {
  int curr = 0;
  int next = 1;
  for (int i = 0; i < 10; i++) {
    printf("%d\t", curr);
    int temp = curr + next;
    curr = next;
    next = temp;
  }
}
