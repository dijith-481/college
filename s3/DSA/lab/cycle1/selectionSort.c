#include <stdio.h>

void selectionSortDesc(int a[], int n) {
  for (int i = 0; i < n - 1; i++) {
    int max = i;
    for (int j = i + 1; j < n; j++) {
      if (a[j] > a[max]) {
        max = j;
      }
    }
    if (max != i) {
      int temp = a[i];
      a[i] = a[max];
      a[max] = temp;
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
  selectionSortDesc(a, n);
  printf("The elements in the array: ");
  for (int i = 0; i < n; i++) {
    printf("%d ", a[i]);
  }
  printf("\n");
}
