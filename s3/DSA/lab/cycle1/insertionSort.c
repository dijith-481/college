#include <stdio.h>

void insertionSortDesc(int a[], int n) {
  for (int i = 1; i < n; i++) {
    int j = i;
    while (j > 0 && a[j] > a[j - 1]) {
      int temp = a[j];
      a[j] = a[j - 1];
      a[j - 1] = temp;
      j--;
    }
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
  insertionSortDesc(a, n);
  printf("The elements in the array: ");
  for (int i = 0; i < n; i++) {
    printf("%d ", a[i]);
  }
  printf("\n");
}
