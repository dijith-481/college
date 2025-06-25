#include "stdio.h"
int largest(int arr[], int n) {
  int largest = arr[0];
  for (int i = 0; i < n; i++) {
    if (arr[i] > largest) {
      largest = arr[i];
    }
  }
  return largest;
}
int smallest(int arr[], int n) {
  int smallest = arr[0];
  for (int i = 0; i < n; i++) {
    if (arr[i] < smallest) {
      smallest = arr[i];
    }
  }
  return smallest;
}
int sum(int arr[], int n) {
  int sum = 0;
  for (int i = 0; i < n; i++) {
    sum += arr[i];
  }
  return sum;
}
float avg(int arr[], int n) { return (float)sum(arr, n) / n; }
int main() {
  printf("enter an number ");
  int n;
  scanf("%d", &n);
  int arr[n];
  for (int i = 0; i < n; i++) {
    scanf("%d", &arr[i]);
  }
  printf("%d\n", largest(arr, n));
  printf("%d\n", smallest(arr, n));
  printf("%d\n", sum(arr, n));
  printf("%f\n", avg(arr, n));
}
