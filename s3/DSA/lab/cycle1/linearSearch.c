#include <stdio.h>

int linearSearch(int a[], int n, int x) {
  for (int i = 0; i < n; i++) {
    if (a[i] == x) {
      return i;
    }
  }
  return -1;
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
  printf("Enter the element to be searched: ");
  int x;
  scanf("%d", &x);
  int index = linearSearch(a, n, x);
  if (index == -1) {
    printf("Element not found\n");
  } else {
    printf("Element found at index %d\n", index);
  }
}
