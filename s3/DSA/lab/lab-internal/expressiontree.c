#include <stdio.h>
#include <stdlib.h>
#define MAX 1000

typedef struct node {
  char data;
  struct node *next;
  struct node *right;
} Node;

Node *createNode(char data) {
  Node *newNode = (Node *)malloc(sizeof(Node));
  if (newNode == NULL) {
    printf("Memory not allocated");
    exit(1);
  }
  newNode->data = data;
  newNode->next = NULL;
  newNode->right = NULL;
  return newNode;
}

char stack[MAX];
int top = -1;
Node *node_stack[MAX];
int node_top;

void push(char item) {
  if (top == MAX - 1) {
    printf("Stack Overflow");
    exit(1);
  }
  stack[++top] = item;
}

char pop() {
  if (top == -1) {
    printf("Stack Underflow");
    exit(1);
  }
  return stack[top--];
}

void node_push(Node *item) {
  if (node_top == MAX - 1) {
    printf("Stack Overflow");
    exit(1);
  }
  node_stack[++node_top] = item;
}

Node *node_pop() {
  if (node_top == -1) {
    printf("Stack Underflow");
    exit(1);
  }
  return node_stack[node_top--];
}

int precedence(char ch) {
  if (ch == '+' || ch == '-') {
    return 1;
  } else if (ch == '*' || ch == '/') {
    return 2;
  } else if (ch == '^') {
    return 3;
  }
  return 0;
}
int isOperator(char ch) {
  if (ch == '+' || ch == '-' || ch == '*' || ch == '/' || ch == '^') {
    return 1;
  }
  return 0;
}
int isOperand(char ch) {
  if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' ||
      ch >= '0' && ch <= '9') {
    return 1;
  }
  return 0;
}

int isEmpty() {
  if (top == -1) {
    return 1;
  }
  return 0;
}
int peek() {
  if (top == -1) {
    return '\0';
  }
  return stack[top];
}

void inorder(Node *root) {
  if (root == NULL) {
    return;
  }
  if (root->next != NULL) {
    inorder(root->next);
  }
  printf("%c ", root->data);
  if (root->right != NULL) {
    inorder(root->right);
  }
}

void postorder(Node *root) {
  if (root == NULL) {
    return;
  }
  if (root->next != NULL) {
    postorder(root->next);
  }
  if (root->right != NULL) {
    postorder(root->right);
  }
  printf("%c ", root->data);
}

void preorder(Node *root) {
  if (root == NULL) {
    return;
  }
  printf("%c ", root->data);
  if (root->next != NULL) {
    preorder(root->next);
  }
  if (root->right != NULL) {
    preorder(root->right);
  }
}

int main() {
  char exp[MAX];
  node_top = -1;
  top = -1;
  printf("Enter infix expression : ");
  scanf("%s", exp);
  for (int i = 0; exp[i] != '\0'; i++) {
    if (exp[i] == '(') {
      push(exp[i]);
    } else if (exp[i] == ')') {
      while (peek() != '(') {
        Node *right = node_pop();
        Node *left = node_pop();
        char op = pop();
        Node *newNode = createNode(op);
        newNode->next = left;
        newNode->right = right;
        node_push(newNode);
      }
      pop();
    } else if (isOperand(exp[i])) {
      node_push(createNode(exp[i]));
    } else if (isOperator(exp[i])) {
      while (!isEmpty() && precedence(exp[i]) <= precedence(peek())) {
        Node *right = node_pop();
        Node *left = node_pop();
        char op = pop();
        Node *newNode = createNode(op);
        newNode->next = left;
        newNode->right = right;
        node_push(newNode);
      }
      push(exp[i]);
    }
  }
  while (!isEmpty()) {
    Node *right = node_pop();
    Node *left = node_pop();
    char op = pop();
    Node *newNode = createNode(op);
    newNode->next = left;
    newNode->right = right;
    node_push(newNode);
  }
  Node *root = node_pop();

  printf("\nPostorder traversal : ");
  postorder(root);
  printf("\nInorder traversal : ");
  inorder(root);
  printf("\nPreorder traversal : ");
  preorder(root);
  return 0;
}
