#include <stdio.h>
#include <string.h>

typedef enum {
  DIFF = 1,
  SIN = 2,
  DEFE = 3,
  ORD = 4

} Category;

typedef struct {
  char name[100];
  Category priority;
  int number;

} Customer;

typedef struct {
  Customer heap[100];
  int size;
  int nextNum;
} PriorityQueue;

int hasHighierPriority(Customer c1, Customer c2) {
  if (c1.priority != c2.priority)
    return c1.priority < c2.priority;
  return c1.number < c2.number;
}

void heapifyUp(PriorityQueue *q, int idx) {
  if (idx == 0)
    return;
  int parent = (idx - 1) / 2;
  if (hasHighierPriority(q->heap[idx], q->heap[parent])) {
    Customer temp = q->heap[idx];
    q->heap[idx] = q->heap[parent];
    q->heap[parent] = temp;
    heapifyUp(q, parent);
  }
}

void heapifyDown(PriorityQueue *q, int idx) {
  int smallest = idx;
  int left = (idx * 2) + 1;
  int right = idx * 2 + 2;
  if (q->size >= left && hasHighierPriority(q->heap[left], q->heap[smallest]))
    smallest = left;
  if (q->size >= right && hasHighierPriority(q->heap[right], q->heap[smallest]))
    smallest = right;
  if (smallest != idx) {
    Customer temp = q->heap[smallest];
    q->heap[smallest] = q->heap[idx];
    q->heap[idx] = temp;
    heapifyDown(q, smallest);
  }
}




void insert(PriorityQueue *q,char * name,Category cat){
  Customer c;
  strcpy(c.name, name);
  c.priority=cat;
  c.number=q->nextNum;
  q->nextNum+=1;
  q->heap[q->size]=c;
  heapifyUp(q, q->size);
  q->size+=1;
}

Customer extractMin(PriorityQueue *q){
  Customer min= q->heap[0];
  q->heap[0]=q->heap[q->size-1];
  q->size-=1;
  if (q->size>0){
  heapifyDown(q, 0);
  }
  return min;

}

int main(){
  PriorityQueue pq;
  pq.size=0;
  pq.nextNum=0;

 }
