#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct node {
  char url[100];
  struct node *next;
  struct node *prev;
} Node;

Node *current = NULL;

Node *createNode(char url[100]) {
  Node *newNode = (Node *)malloc(sizeof(Node));
  if (newNode == NULL) {
    printf("Memory not allocated");
    exit(1);
  }
  strcpy(newNode->url, url);
  newNode->next = NULL;
  return newNode;
}

void visitNew(char url[100]) {
  Node *newNode = createNode(url);
  if (current == NULL) {
    current = newNode;
    return;
  }
  current->next = newNode;
  newNode->prev = current;
  current = newNode;
}

void goback() {
  if (current == NULL || current->prev == NULL) {
    printf("No previous page");
    return;
  }
  current = current->prev;
  printf("%s\n", current->url);
}

void goforward() {
  if (current == NULL || current->next == NULL) {
    printf("No next page");
    return;
  }
  current = current->next;
  printf("%s\n", current->url);
}

void displayCurrent() {
  if (current == NULL) {
    printf("No page");
    return;
  }
  printf("%s\n", current->url);
}

int main() {
  char url[100];
  Node *root = NULL;
  while (1) {
    int current;
    printf("select option:\n1.visit\n2.go back\n3.go forward\n4.display "
           "current\n5.exit\n");
    scanf("%d", &current);
    switch (current) {
    case 1:
      printf("enter url: ");
      scanf("%s", url);
      visitNew(url);
      break;
    case 2:
      goback();
      break;
    case 3:
      goforward();
      break;
    case 4:
      displayCurrent();
      break;
    case 5:
      return 0;
    default:
      printf("invalid option");
      break;
    }
  }
}
