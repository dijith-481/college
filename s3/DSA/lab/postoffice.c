#include <stdio.h>
#include <string.h>

#define MAX 100

typedef struct {
  char name[50];
  int priority;
  char category[30];
} Customer;

typedef struct {
  Customer heap[MAX];
  int size;
} MinHeap;

void initHeap(MinHeap *h) { h->size = 0; }

void swap(Customer *a, Customer *b) {
  Customer temp = *a;
  *a = *b;
  *b = temp;
}

void heapifyUp(MinHeap *h, int index) {
  int parent = (index - 1) / 2;

  if (index > 0 && h->heap[index].priority < h->heap[parent].priority) {
    swap(&h->heap[index], &h->heap[parent]);
    heapifyUp(h, parent);
  }
}

void heapifyDown(MinHeap *h, int index) {
  int smallest = index;
  int left = 2 * index + 1;
  int right = 2 * index + 2;

  if (left < h->size && h->heap[left].priority < h->heap[smallest].priority) {
    smallest = left;
  }

  if (right < h->size && h->heap[right].priority < h->heap[smallest].priority) {
    smallest = right;
  }

  if (smallest != index) {
    swap(&h->heap[index], &h->heap[smallest]);
    heapifyDown(h, smallest);
  }
}

void insert(MinHeap *h, char name[], int priority, char category[]) {
  if (h->size >= MAX) {
    printf("Queue is full!\n");
    return;
  }

  strcpy(h->heap[h->size].name, name);
  h->heap[h->size].priority = priority;
  strcpy(h->heap[h->size].category, category);

  heapifyUp(h, h->size);
  h->size++;

  printf("Customer '%s' added with category '%s'\n", name, category);
}

Customer extractMin(MinHeap *h) {
  Customer min = h->heap[0];
  h->heap[0] = h->heap[h->size - 1];
  h->size--;
  heapifyDown(h, 0);
  return min;
}

int isEmpty(MinHeap *h) { return h->size == 0; }

void displayQueue(MinHeap *h) {
  if (isEmpty(h)) {
    printf("\nQueue is empty\n");
    return;
  }

  printf("\nCurrent queue:\n");
  for (int i = 0; i < h->size; i++) {
    printf("%d. %s - %s\n", i + 1, h->heap[i].name, h->heap[i].category);
  }
}

void processQueue(MinHeap *h) {
  if (isEmpty(h)) {
    printf("\nNo customers to process!\n");
    return;
  }

  printf("\n=== Processing Customers in Priority Order ===\n");
  int position = 1;

  while (!isEmpty(h)) {
    Customer c = extractMin(h);
    printf("%d. %s (%s)\n", position++, c.name, c.category);
  }
}

int main() {
  MinHeap pq;
  initHeap(&pq);

  int choice, priority;
  char name[50], category[30];

  printf("=== Post Office Priority Queue System ===\n");
  printf("Priority: 1=Differently Abled, 2=Senior Citizen, 3=Defence, "
         "4=Normal\n\n");

  while (1) {
    printf("\n--- Menu ---\n");
    printf("1. Add Customer\n");
    printf("2. Display Current Queue\n");
    printf("3. Process All Customers\n");
    printf("4. Exit\n");
    printf("Enter choice: ");
    scanf("%d", &choice);

    switch (choice) {
    case 1:
      printf("\nEnter customer name: ");
      scanf(" %[^\n]", name);

      printf("\nSelect Category:\n");
      printf("1. Differently Abled\n");
      printf("2. Senior Citizen\n");
      printf("3. Defence Personnel\n");
      printf("4. Normal Person\n");
      printf("Enter category (1-4): ");
      scanf("%d", &priority);

      if (priority < 1 || priority > 4) {
        printf("Invalid category!\n");
        break;
      }

      switch (priority) {
      case 1:
        strcpy(category, "Differently Abled");
        break;
      case 2:
        strcpy(category, "Senior Citizen");
        break;
      case 3:
        strcpy(category, "Defence Personnel");
        break;
      case 4:
        strcpy(category, "Normal Person");
        break;
      }

      insert(&pq, name, priority, category);
      break;

    case 2:
      displayQueue(&pq);
      break;

    case 3:
      processQueue(&pq);
      break;

    case 4:
      printf("\nThank you for using the system!\n");
      return 0;

    default:
      printf("\nInvalid choice!\n");
    }
  }

  return 0;
}
