#include "stdio.h"
#include <stdlib.h>

typedef struct {
  int values[100];
  int min;
  int size;
} SortedArray;

typedef struct {
  SortedArray *arr;
} HeapItem;

typedef struct {
  HeapItem heap[100];
  int size;
} Heap;

void heapifyUp(Heap *h, int idx) {
  if (idx == 0)
    return;
  int parent = (idx - 1) / 2;
  if (h->heap[idx].arr->values[h->heap[idx].arr->min] < h->heap[parent].arr->values[h->heap[parent].arr->min]) {
    HeapItem temp = h->heap[parent];
    h->heap[parent] = h->heap[idx];
    h->heap[idx] = temp;
    heapifyUp(h, parent);
  }
}

void heapifyDown(Heap *h, int idx) {
  int left = idx * 2 + 1;
  int right = idx * 2 + 2;
  int selected = idx;

if (left < h->size && 
      h->heap[left].arr->values[h->heap[left].arr->min] < 
      h->heap[selected].arr->values[h->heap[selected].arr->min]) {
    selected = left;
  }
  if (right < h->size && 
      h->heap[right].arr->values[h->heap[right].arr->min] < 
      h->heap[selected].arr->values[h->heap[selected].arr->min]) {
    selected = right;
  }  if (selected != idx) {
    HeapItem temp = h->heap[idx];
    h->heap[idx] = h->heap[selected];
    h->heap[selected] = temp;
    heapifyDown(h, selected);
  }
}

HeapItem pop(Heap *h) {
  HeapItem min = h->heap[0];
  h->size -= 1;
  h->heap[0] = h->heap[h->size];
  if (h->size > 0)
    heapifyDown(h, 0);
  return min;
}

int isEmpty(Heap *h) { return h->size == 0; }

void push(Heap *h, HeapItem item) {
  h->heap[h->size] = item;
  heapifyUp(h, h->size);
  h->size += 1;
}

void heapSort(Heap *h, int *res) {
  int i = 0;
  while (!isEmpty(h)) {
    HeapItem item = pop(h);
    res[i] = item.arr->values[item.arr->min];
    i++;
      item.arr->min += 1;
    if (item.arr->min < item.arr->size) {
      push(h, item);
    }else{
      free(item.arr);
    }
  }
}

int main() {
  int n;
  printf("enter no of sorted arrays: ");
  scanf("%d", &n);
  Heap h;
  h.size = 0;
  int totalSize = 0;
  for (int i = 0; i < n; i++) {
    printf("enter no of elements in  array: ");
    int a;
    HeapItem item;
    SortedArray *arr = (SortedArray *)malloc(sizeof(SortedArray));
    arr->min = 0;
    scanf("%d", &a);
    totalSize += a;
    printf("enter elements in  array: ");
    for (arr->size = 0; arr->size < a; arr->size++) {
      scanf("%d", &arr->values[arr->size]);
    }
    item.arr = arr;
    push(&h, item);
  }

  int res[totalSize];
  heapSort(&h, res);
  for (int i = 0; i < totalSize; i++) {
    printf("%d\t", res[i]);
  }
  printf("\n");
}
