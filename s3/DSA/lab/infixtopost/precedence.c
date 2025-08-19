#include<stdio.h>
int precedence(char ch) {
    switch (ch) {
        case '+':
        case '-':
            return 1;
        case '*':
        case '/':
            return 2;
        case '^':
            return 3;
    }
    return 0; 
}

int is_operator(char c) {
    return (c == '+' || c == '-' || c == '*' || c == '/');
}

int perform_operation(int op1, int op2, char operator) {
    switch (operator) {
        case '+': return op1 + op2;
        case '-': return op1 - op2;
        case '*': return op1 * op2;
        case '/': 
            if (op2 == 0) {
                printf("Error: Division by zero!\n");
                return 0; 
            }
            return op1 / op2;
        default: return 0; 
    }
}
