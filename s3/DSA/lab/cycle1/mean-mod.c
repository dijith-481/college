#include <stdio.h>

float mean(int a[], int n) {
  int sum = 0;
  for (int i = 0; i < n; i++) {
    sum += a[i];
  }
  return (float)sum / n;
}

void bubbleSort(int a[], int n) {
  for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        int temp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = temp;
      }
    }
  }
}

float median(int a[], int n) {
  bubbleSort(a, n);
  int half = n / 2;
  if (n % 2 == 0) {
    return (float)(a[half - 1] + a[half]) / 2;
  } else {
    return a[half];
  }
}

int mode(int a[], int n) {
  int max_count = 0;
  int mode = a[0];
  for (int i = 0; i < n; i++) {
    int count = 0;
    for (int j = 0; j < n; j++) {
      if (a[i] == a[j]) {
        count++;
      }
    }
    if (count > max_count) {
      max_count = count;
      mode = a[i];
    }
  }
  return mode;
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
  printf("Mean: %.2f\n", mean(a, n));
  printf("Median: %.2f\n", median(a, n));
  printf("Mode: %d\n", mode(a, n));
}
