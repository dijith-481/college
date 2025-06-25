#include <stdio.h>

int main() {

  int n, i, flag = 0;

  // Get the number of elements to be used from the user.
  printf("Enter the number of elements in an array: \n");
  scanf("%d", &n);

  // Declare the array.
  int a[n];

  // Input the elements into the array.
  printf("Enter the elements: \n");
  for (i = 0; i < n; i++) {
    scanf("%d", &a[i]);
  }

  // Linear Search.

  // Get the key to be founded.
  int key;
  printf("Enter the number to be found:\n");
  scanf("%d", &key);

  // Search through each element in the array.
  for (i = 0; i < n; i++) {
    if (a[i] == key) {
      printf("%d,%d\n", a[i], key);
      flag = 1;
      break;
    }
  }

  // Show the position of the key in the array.
  if (flag = 1) {
    printf("%d is found at %dth position\n", key, i + 1);
  } else {
    printf("No such element found\n");
  }

  return 0;
}
