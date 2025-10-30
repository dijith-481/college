#include <stdio.h>

typedef struct {
  int a[100];
  int n;
} Arr;

void insertionSort(Arr arr) {
  for (int i = 1; i < arr.n; i++) {
    int j = i - 1;
    while (j >= 0 && arr.a[j] > arr.a[j + 1]) {
      arr.a[j] ^= arr.a[j + 1];
      arr.a[j + 1] ^= arr.a[j];
      arr.a[j] ^= arr.a[j + 1];
      j--;
    }
  }
  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
}

void bubbleSort(Arr arr) {
  for (int i = arr.n; i > 0; i--) {
    int isSwapped = 0;
    for (int j = 0; j < i - 1; j++) {
      if (arr.a[j] > arr.a[j + 1]) {
        isSwapped = 1;
        arr.a[j] ^= arr.a[j + 1];
        arr.a[j + 1] ^= arr.a[j];
        arr.a[j] ^= arr.a[j + 1];
      }
    }
    if (isSwapped == 0) {
      break;
    }
  }
  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
}

void merge(int *a, int l, int m, int r) {
  int nl = m - l + 1;
  int nr = r - m;
  int i = 0, j = 0, k = l;
  int L[nl], R[nr];
  for (int n = 0; n < nl; n++) {
    L[n] = a[l + n];
  }
  for (int n = 0; n < nr; n++) {
    R[n] = a[m + n + 1];
  }
  while (i < nl && j < nr) {
    if (L[i] <= R[j]) {
      a[k] = L[i];
      i++;
    } else {
      a[k] = R[j];
      j++;
    }
    k++;
  }
  while (i < nl) {
    a[k] = L[i];
    i++;
    k++;
  }
  while (j < nr) {
    a[k] = R[j];
    j++;
    k++;
  }
}

void merge_sort(int *a, int start, int end) {

  if (start >= end)
    return;
  int mid = (start + end) / 2;
  merge_sort(a, start, mid);
  merge_sort(a, mid + 1, end);
  merge(a, start, mid, end);
}

void mergeSort(Arr arr) {
  merge_sort(arr.a, 0, arr.n - 1);
  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
}

int partition(int *a, int l, int r) {
  int pivot = a[l];
  int j = l;
  for (int i = l + 1; i <= r; i++) {
    if (a[i] < pivot) {
      j++;
      int temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    }
    int temp=a[j];
    a[j]=a[l];
    a[l]=temp;


  return j;
}

void quick_sort(int *a, int l, int r) {
  if (l >= r)
    return;
  int p = partition(a, l, r);
  quick_sort(a, l, p - 1);
  quick_sort(a, p + 1, r);
}

void quickSort(Arr arr) {
  quick_sort(arr.a, 0, arr.n - 1);
  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
}

void countSort(int *a, int n, int exp) {
  int count[10];
  int output[n];
  for (int i = 0; i < 10; i++) {
    count[i] = 0;
  }
  for (int i = 0; i < n; i++) {
    count[(a[i] / exp) % 10]++;
  }
  for (int i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }
  for (int i = n - 1; i >= 0; i--) {
    int digit = (a[i] / exp) % 10;
    output[count[digit] - 1] = a[i];
    count[digit]--;
  }

  for (int i = 0; i < n; i++) {
    a[i] = output[i];
  }

}

int getMax(int *a, int n) {
  int max = a[0];
  for (int i = 1; i < n; i++) {
    max = max > a[i] ? max : a[i];
  }
  return max;
}

void radixSort(Arr arr) {
  int max = getMax(arr.a, arr.n);
  for (int exp = 1; max / exp > 0; exp *= 10) {
    countSort(arr.a, arr.n, exp);
  }
  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
}

int main() {
  Arr arr = {.n = 62,
  .a = {9,   3,   65,  75,   3,  4,  56,  7,   4, 3,    30, 56, 33,
  7,   5,   5,   6,    76, 7,  6,   47,  7, 5,    7,  76, 757,
  857, 756, 757, 8,    43, 5,  325, 37,  7, 8,    5,  75, 645,
  87,  98,  9,   6868, 8,  9,  89,  678, 0, 6,    3,  5,  5,
  2,   2,   4,   25,   6,  78, 9,   68,  7, 46746}};
  // Arr arr = {.n = 7, .a = {8, 4, 2,4,8, 6, 0}};

  for (int i = 0; i < arr.n; i++) {
    printf("%d\t", arr.a[i]);
  }
  printf("\n");
  printf("insertion\n");
  insertionSort(arr);
  printf("bubble");
  bubbleSort(arr);
  printf("merge");
  mergeSort(arr);
  printf("quick\n");
  quickSort(arr);
  printf("radix\n");
  radixSort(arr);
}
