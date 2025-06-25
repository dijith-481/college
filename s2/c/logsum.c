#include <stdio.h>
int main() {
  float x;
  double sum;
  x = 1.3;
  double y = (double)(x - 1) / x;
  sum = y;
  for (int i = 1; i < 7; i++) {
    double power = 0.5 * y;
    for (int j = 0; j < i; j++) {
      power *= y;
    }
    /* printf("%f ", power); */
    printf("%f ", sum);
    sum += power;
  }
  printf("%f\n", sum);
}
