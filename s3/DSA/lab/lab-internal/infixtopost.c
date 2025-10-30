#include <stdio.h>
#define MAXOP 100

int precedence(char c) {
  switch (c) {
  case '^':
    return 3;
  case '*':
  case '/':
    return 2;
  case '+':
  case '-':
    return 1;
  default:
    return 0;
  }
}

int stack[MAXOP];
int top = -1;

void push(int x) {
  if (top >= MAXOP - 1) {
    printf("Stack overflow\n");
    return;
  }
  top++;
  stack[top] = x;
}

int pop() {
  if (top == -1) {
    printf("Stack underflow\n");
    return 0;
  }
  return stack[top--];
}
int peek() {
  if (top == -1) {
    printf("Stack underflow\n");
    return 0;
  }
  return stack[top];
}

int isEmpty() { return top < 0; }

int isOperand(char c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9');
}

void infixToPostfix(char infix[], char postfix[]) {
  int i = 0;
  int j = 0;
  while (infix[i] != '\0') {
    if (infix[i] == '(') {
      push(infix[i]);
      i++;
    } else if (infix[i] == ')') {
      while (peek() != '(') {
        postfix[j] = pop();
        j++;
      }
      pop();
      i++;
    } else if (isOperand(infix[i])) {
      postfix[j] = infix[i];
      i++;
      j++;
    } else if (isEmpty() || precedence(infix[i]) > precedence(peek())) {
      push(infix[i]);
      i++;
    } else {
      while (!isEmpty() && precedence(infix[i]) <= precedence(peek())) {
        postfix[j] = pop();
        j++;
      }
      push(infix[i]);
      i++;
    }
  }
  while (!isEmpty()) {
    postfix[j] = pop();
    j++;
  }
  postfix[j] = '\0';
}

int exponent(int n1, int n2) {
  int res = 1;
  for (int i = 0; i < n2; i++) {
    res = res * n1;
  }
  return n1;
}

void evaluate(char postfix[]) {
  int i = 0;
  int num = 0;
  top = -1;
  while (postfix[i] != '\0') {
    if (postfix[i] >= '0' && postfix[i] <= '9') {
      push(postfix[i] - '0');
    } else {
      int n2 = pop();
      int n1 = pop();
      switch (postfix[i]) {
      case '+':
        push(n1 + n2);
        break;
      case '-':
        push(n1 - n2);
        break;
      case '*':
        push(n1 * n2);
        break;
      case '/':
        push(n1 / n2);
        break;
      case '^':
        push(exponent(n1, n2));
        break;
      }
    }
    i++;
  }
  printf("Result: %d\n", pop());
}

int main() {
  char infix[MAXOP];
  char postfix[MAXOP];
  printf("Enter infix expression: ");
  scanf("%s", infix);
  infixToPostfix(infix, postfix);
  evaluate(postfix);
  printf("Postfix expression: %s\n", postfix);
}
