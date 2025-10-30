
#include <stdio.h>
#include <stdlib.h>

typedef struct {
  int exp;
  int coeff;
} Poly;

typedef struct node {
  Poly data;
  struct node *next;
} Node;

Node *createNode(int exp, int coeff) {
  Node *newNode = (Node *)malloc(sizeof(Node));
  if (newNode == NULL) {
    printf("Memory not allocated");
    exit(1);
  }
  newNode->data.exp = exp;
  newNode->data.coeff = coeff;
  newNode->next = NULL;
  return newNode;
}

Node *add(Node *root1, Node *root2, Node *rootAns) {
  Node *temp = NULL;
  while (root1 != NULL && root2 != NULL) {
    if (root1->data.exp == root2->data.exp) {
      int sum = root1->data.coeff + root2->data.coeff;
      rootAns = createNode(root1->data.exp, sum);
      rootAns = rootAns->next;
      root1 = root1->next;
      root2 = root2->next;
    } else if (root1->data.exp > root2->data.exp) {
      rootAns = createNode(root1->data.exp, root1->data.coeff);
      rootAns = rootAns->next;
      root1 = root1->next;
    } else {
      rootAns = createNode(root2->data.exp, root2->data.coeff);
      rootAns = rootAns->next;
      root2 = root2->next;
    }
  }
  while (root1 != NULL) {
    rootAns = createNode(root1->data.exp, root1->data.coeff);
    rootAns = rootAns->next;
    root1 = root1->next;
  }
  while (root2 != NULL) {
    rootAns = createNode(root2->data.exp, root2->data.coeff);
    rootAns = rootAns->next;
    root2 = root2->next;
  }
}

Node *input(Node *root) {
  int exp, coeff;
  Node *temp = NULL;
  while (1) {
    printf("Enter the exponents and coefficients of the polynomial : ");
    scanf("%d %d", &exp, &coeff);
    if (exp == 0 && coeff == 0) {
      break;
    }
    root = createNode(exp, coeff);
    if (temp == NULL) {
      temp = root;
    }
    root = root->next;
  }
  return temp;
}

int main() {
  Node *root1 = NULL;
  Node *root2 = NULL;
  Node *rootAns = NULL;
  input(root1);
  input(root2);
  add(root1, root2, rootAns);
  while (rootAns != NULL) {
    printf("%d %d\n", rootAns->data.exp, rootAns->data.coeff);
    rootAns = rootAns->next;
  }
  return 0;
}
