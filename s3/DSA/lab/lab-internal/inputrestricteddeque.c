
#include <stdio.h>
#include <stdlib.h>
#define MAX 100

typedef struct {
  int data[MAX];
  int front;
  int rear;
} Queue;

typedef struct InputRestrictedDeque InputRestrictedDeque;

struct InputRestrictedDeque {
  Queue *q;
  void (*insertRear)(InputRestrictedDeque *ird, int item);
  void (*deleteFront)(InputRestrictedDeque *ird);
  void (*deleteRear)(InputRestrictedDeque *ird);
};

int circularIsFull(Queue *q) {
  if ((q->rear + 1) % MAX == q->front) {
    return 1;
  }
  return 0;
}

int circularIsEmpty(Queue *q) {
  if (q->front == -1) {
    return 1;
  }
  return 0;
}

void internal_insertRear(Queue *q, int item) {
  if (circularIsFull(q)) {
    printf("\nQueue is full. Cannot insert %d.\n", item);
    return;
  }
  if (circularIsEmpty(q)) {
    q->front = 0;
  }
  q->rear = (q->rear + 1) % MAX;
  q->data[q->rear] = item;
}

void internal_deleteFront(Queue *q) {
  if (circularIsEmpty(q)) {
    printf("\nQueue is empty. Cannot delete front.\n");
    return;
  }
  if (q->front == q->rear) {
    q->front = -1;
    q->rear = -1;
  } else {
    q->front = (q->front + 1) % MAX;
  }
}

void internal_deleteRear(Queue *q) {
  if (circularIsEmpty(q)) {
    printf("\nQueue is empty. Cannot delete rear.\n");
    return;
  }
  if (q->front == q->rear) {
    q->front = -1;
    q->rear = -1;
  } else {
    q->rear = (q->rear - 1 + MAX) % MAX;
  }
}

// --- Wrapper functions that pass the internal queue pointer ---

void ird_insertRear(InputRestrictedDeque *ird, int item) {
  internal_insertRear(ird->q, item);
}

void ird_deleteFront(InputRestrictedDeque *ird) {
  internal_deleteFront(ird->q);
}

void ird_deleteRear(InputRestrictedDeque *ird) { internal_deleteRear(ird->q); }

// --- Constructor for Automatic Initialization ---

InputRestrictedDeque *createIRD() {
  InputRestrictedDeque *ird =
      (InputRestrictedDeque *)malloc(sizeof(InputRestrictedDeque));
  if (ird == NULL) {
    perror("Failed to allocate memory for IRD structure");
    exit(EXIT_FAILURE);
  }

  Queue *q = (Queue *)malloc(sizeof(Queue));
  if (q == NULL) {
    perror("Failed to allocate memory for Queue data");
    free(ird);
    exit(EXIT_FAILURE);
  }

  q->front = -1;
  q->rear = -1;

  ird->q = q;
  ird->insertRear = ird_insertRear;
  ird->deleteFront = ird_deleteFront;
  ird->deleteRear = ird_deleteRear;

  return ird;
}

void destroyIRD(InputRestrictedDeque *ird) {
  if (ird) {
    free(ird->q);
    free(ird);
  }
}

void displayIRD(InputRestrictedDeque *ird) {
  Queue *q = ird->q;
  if (circularIsEmpty(q)) {
    printf("\nIRD: Empty\n");
    return;
  }
  printf("\nIRD contents: ");
  int i = q->front;
  do {
    printf("%d ", q->data[i]);
    i = (i + 1) % MAX;
  } while (i != (q->rear + 1) % MAX);
  printf("\n");
}

int main() {
  InputRestrictedDeque *my_ird = createIRD();

  printf("--- Input Restricted Deque Demonstration ---\n");
  printf("Rule: Insertion only allowed at Rear.\n");

  my_ird->insertRear(my_ird, 10);
  my_ird->insertRear(my_ird, 20);
  my_ird->insertRear(my_ird, 30);
  displayIRD(my_ird); // Output: 10 20 30

  printf("\nDeleting from Front...\n");
  my_ird->deleteFront(my_ird);
  displayIRD(my_ird); // Output: 20 30

  printf("\nDeleting from Rear...\n");
  my_ird->deleteRear(my_ird);
  displayIRD(my_ird); // Output: 20

  printf("\nAttempting to delete all elements...\n");
  my_ird->deleteRear(my_ird);
  my_ird->deleteFront(my_ird);

  destroyIRD(my_ird);

  return 0;
}
