#include <stdio.h>
#define MAX 100

typedef struct {
  int data[MAX];
  int front;
  int rear;
} Queue;

int isFull(Queue q) {
  if (q.rear == MAX - 1) {
    printf("Queue is full");
    return 1;
  }
  return 0;
}

int isEmpty(Queue q) {
  if (q.front == -1) {
    return 1;
  }
  return 0;
}

void enqueue(Queue q, int item) {
  if (isFull(q)) {
    return;
  }
  q.rear = (q.rear + 1);
  q.data[q.rear] = item;
}

int dequeue(Queue q) {
  if (isEmpty(q)) {
    printf("Queue is empty");
    return -1;
  }
  int item = q.data[q.front];
  q.front = (q.front + 1);
  return item;
}

void display(Queue q) {
  if (isEmpty(q)) {
    printf("Queue is empty");
    return;
  }
  printf("Queue is not empty\n");
  for (int i = q.front; i <= q.rear; i++) {
    printf("%d ", q.data[i]);
  }
  printf("\n");
}

int circularIsFull(Queue q) {
  if (q.rear == (q.front + 1) % MAX) {
    printf("Circular queue is full");
    return 11;
  }
  return 0;
}

int circularIsEmpty(Queue q) {
  if (q.front == -1) {
    printf("Circular queue is empty");
    return 1;
  }
  return 0;
}

Queue circularEnqueue(Queue q, int item) {
  if (circularIsFull(q)) {
    return q;
  }
  q.rear = (q.rear + 1) % MAX;
  q.data[q.rear] = item;
  return q;
}

int circularDequeue(Queue q) {
  if (circularIsEmpty(q)) {
    printf("Circular queue is empty");
    return -1;
  }
  int item = q.data[q.front];
  q.front = (q.front + 1) % MAX;
  if (q.front == q.rear) {
    q.front = -1;
    q.rear = -1;
  }
  return item;
}

void circularDisplay(Queue q) {
  if (circularIsEmpty(q)) {
    printf("Circular queue is empty");
    return;
  }
  printf("Circular queue is not empty\n");
  for (int i = q.front; i != q.rear; i = (i + 1) % MAX) {
    printf("%d ", q.data[i]);
  }
  printf("\n");
}

void insertFront(Queue q, int item) {
  if (circularIsFull(q)) {
    return;
  }
  q.front = (q.front - 1) % MAX;
  q.data[q.front] = item;
}

void insertRear(Queue q, int item) { circularEnqueue(q, item); }

void deleteFront(Queue q) { circularDequeue(q); }

void deleteRear(Queue q) {
  if (circularIsEmpty(q)) {
    printf("Circular queue is empty");
    return;
  }
  q.rear = (q.rear - 1) % MAX;
  if (q.front == q.rear) {
    q.front = -1;
    q.rear = -1;
  }
}
