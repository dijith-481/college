#include <stdio.h>

int main() {
  int num, rev = 0, remainder;

  printf("Enter a number: ");
  scanf("%d", &num);

  while (num != 0) {
    remainder = num % 10;       // Get the last digit
    rev = rev * 10 + remainder; // Append it to reversed number
    num /= 10;                  // Remove last digit from original number
  }

  printf("Reversed number: %d\n", rev);

  return 0;
}
