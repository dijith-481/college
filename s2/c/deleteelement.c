#include <stdio.h>
int main() {
  int array_size, element_to_delete;
  printf("enter n: ");
  scanf("%d", &array_size);
  int numbers[array_size];
  printf("enter elements: ");
  // reading elements to array
  for (int i = 0; i < array_size; i++) {
    scanf("%d", &numbers[i]);
  }
  printf("enter element to delete: ");
  scanf("%d", &element_to_delete);
  int i;
  // find if element is inside numbers array.
  for (i = 0; i < array_size; i++) {
    if (element_to_delete == numbers[i]) {
      array_size--; // reduce the size of array
      break;
    }
  }
  // copy elements after the deleting element to one positon before.
  for (; i < array_size; i++) {
    numbers[i] = numbers[i + 1];
  }
  // print
  for (i = 0; i < array_size; i++) {
    printf("%d\t", numbers[i]);
  }
  return 0;
}
