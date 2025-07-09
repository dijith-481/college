#include <stdio.h>
void bubbleSortDesc(int a[], int n) {
  for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (a[j] < a[j + 1]) {
        int temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
      }
    }
  }
}

int main() {
  printf("Enter the number of elements: ");
  int n;
  scanf("%d", &n);
  int a[n];
  printf("Enter the elements: ");
  for (int i = 0; i < n; i++) {
    scanf("%d", &a[i]);
  }
  bubbleSortDesc(a, n);
  printf("The elements in the array: ");
  for (int i = 0; i < n; i++) {
    printf("%d ", a[i]);
  }
  printf("\n");
}
