#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define MAX_WORD_SIZE 50

typedef struct node {
  char word[MAX_WORD_SIZE];
  struct node *next;
} Node;

Node *createNode(char *word) {
  Node *newNode = (Node *)malloc(sizeof(Node));
  strncpy(newNode->word, word, MAX_WORD_SIZE);
  return newNode;
}

Node *appendNode(Node *head, Node *newNode) {
  Node *temp = head;
  if (temp == NULL) {
    return newNode;
  }
  while (temp->next != NULL) {
    temp = temp->next;
  }
  temp->next = newNode;
  return head;
}

Node *findWord(Node *head, char *word) {
  Node *temp = head;
  while (temp != NULL) {
    if (strcmp(temp->word, word) == 0) {
      return temp;
    }
    temp = temp->next;
  }
  return NULL;
}

void replaceWord(Node *node, char *word) {
  strncpy(node->word, word, MAX_WORD_SIZE);
}

Node *input() {
  char word[MAX_WORD_SIZE];
  Node *head = NULL;
  while (scanf("%s", word) == 1) {
    head = appendNode(head, createNode(word));

    char c;
    while ((c = getchar()) == ' ' || c == '\t');

    if (c == '\n')
      break;
  }
  return head;
}

void display(Node *head) {
  while (head != NULL) {
    printf("%s ", head->word);
    head = head->next;
  }
  printf("\n ");
}

int main() {
  printf("enter sentence: ");
  Node *head = input();
  display(head);
  char target[MAX_WORD_SIZE], replace[MAX_WORD_SIZE];
  printf("enter word to find: ");
  scanf("%s", target);
  Node *targetNode = findWord(head, target);
  if (targetNode == NULL) {
    printf("not found");
    return 0;
  }
  printf("enter word to replace ");
  scanf("%s", replace);
  replaceWord(targetNode, replace);
  display(head);
}
