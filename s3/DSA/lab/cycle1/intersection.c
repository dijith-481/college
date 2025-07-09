#include <stdio.h>

int intersection(int a[], int b[], int n1, int n2, int inter[]) {

  int count = 0;
  for (int i = 0; i < n1; i++) {
    for (int j = 0; j < n2; j++) {
      if (a[i] == b[j]) {
        int flag = 1;
        for (int k = 0; k < count; k++) {
          if (inter[k] == a[i]) {
            flag = 0;
            break;
          }
        }
        if (flag) {
          inter[count] = a[i];
          count++;
        }
      }
    }
  }
  return count;
}

int main() {
  int n1, n2;
  printf("Enter the number of elements in array 1: ");
  scanf("%d", &n1);
  printf("Enter the number of elements in array 2: ");
  scanf("%d", &n2);
  int a[n1], b[n2], inter[n1];
  printf("Enter the elements of array 1: ");
  for (int i = 0; i < n1; i++) {
    scanf("%d", &a[i]);
  }
  printf("Enter the elements of array 2: ");
  for (int i = 0; i < n2; i++) {
    scanf("%d", &b[i]);
  }
  int count = intersection(a, b, n1, n2, inter);
  printf("The number of elements in the intersection: ");
  printf("%d\n", count);
  printf("The elements in the intersection: ");
  for (int i = 0; i < count; i++) {
    printf("%d ", inter[i]);
  }
}
