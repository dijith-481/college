#include <stdio.h>

void rotate(int a[], int n, char dir, int k) {
  k = k % n;
  if (dir == 'l') {
    k = n - k;
  }
  for (int i = 0; i < k; i++) {
    int temp = a[n - 1];
    for (int j = n - 2; j >= 0; j--) {
      a[j + 1] = a[j];
    }
    a[0] = temp;
  }
}

int main() {
  int n;
  printf("Enter the number of elements: ");
  scanf("%d", &n);
  int a[n];
  printf("Enter the elements: ");
  for (int i = 0; i < n; i++) {
    scanf("%d", &a[i]);
  }
  char dir;
  printf("Enter the direction: ");
  scanf(" %c", &dir);
  int k;
  printf("Enter the number of rotations: ");
  scanf("%d", &k);
  rotate(a, n, dir, k);
  for (int i = 0; i < n; i++) {
    printf("%d ", a[i]);
  }
}
