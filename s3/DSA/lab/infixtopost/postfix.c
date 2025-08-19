#include<stdio.h>
#include "stack.c"
#include "precedence.c"
int evaluate_postfix(char* expression) {
    int i = 0;
    while (expression[i] != '\0') {
        if (expression[i] >= '0' && expression[i] <= '9') { 
            push(expression[i] - '0'); 
        } else if (is_operator(expression[i])) { 
            int op2 = pop();
            int op1 = pop();
            push(perform_operation(op1, op2, expression[i]));
        }
        i++;
    }
    return pop(); 
}

int main() {
	char postfix_expression[100] ;
        printf("enter postfix: ");
        scanf("%s",&postfix_expression);
    	int result = evaluate_postfix(postfix_expression);
    	printf("Result: %d\n", result); 
    	return 0;
}
