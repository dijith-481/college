#include <stdio.h>
void bintodec(char bin[], int n) {
  int i = 0;
  while (n) {
    for (int j = i; j >= 0; j--) {
      bin[j + 1] = bin[j];
    }
    if (n % 2) {
      bin[0] = '1';
    } else {
      bin[0] = '0';
    }
    n /= 2;
    i++;
  }
  bin[i] = '\0';
}
int main() {
  int n;
  scanf("%d", &n);

  char bin[30];
  bintodec(bin, n);
  printf("%s", bin);
}
