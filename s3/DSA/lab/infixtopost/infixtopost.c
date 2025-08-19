#include "stack.c"
#include "precedence.c"
#include <stdio.h>

void infixToPostfix(char* infix) {
    char postfix[MAX_STACK_SIZE]; 
    int i, j = 0;

    for (i = 0; infix[i] != '\0'; i++) {
        char current_char = infix[i];

        if ((current_char >= 'a' && current_char <= 'z') || (current_char >= 'A' && current_char <= 'Z') || (current_char >= '0' && current_char <= '9')) {
            postfix[j++] = current_char;
        } else if (current_char == '(') {
            push(current_char);
        } else if (current_char == ')') {
            while (!isEmpty() && peek() != '(') {
                postfix[j++] = pop();
            }
            if (!isEmpty() && peek() == '(') {
                pop(); 
            }
        } else {
            while (!isEmpty() && precedence(peek()) >= precedence(current_char)) {
                postfix[j++] = pop();
            }
            push(current_char);
        }
    }

    while (!isEmpty()) {
        postfix[j++] = pop();
    }
    postfix[j] = '\0'; 

    printf("Postfix expression: %s\n", postfix);
}

int main() {
   	char infix_expression[100] ;
	printf("enter infix: ");
	scanf("%s",&infix_expression);
	infixToPostfix(infix_expression);
    	return 0;
}
