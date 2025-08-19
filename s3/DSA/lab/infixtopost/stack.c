#include<stdio.h>
#define MAX_STACK_SIZE 100 

char stack[MAX_STACK_SIZE];
int top = -1;

void push(char item) {
    if (top >= MAX_STACK_SIZE - 1) {
        printf("Stack Overflow\n");
        return;
    }
    stack[++top] = item;
}

char pop() {
    if (top == -1) {
        printf("Stack Underflow\n");
        return '\0'; 
    }
    return stack[top--];
}

char peek() {
    if (top == -1) {
        return '\0'; 
    }
    return stack[top];
}

int isEmpty() {
    return top == -1;
}
