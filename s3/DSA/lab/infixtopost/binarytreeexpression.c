#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include "precedence.c"
#include "stack.c"

typedef struct Node {
    char data;
    struct Node* left;
    struct Node* right;
} Node;

Node *node_stack[MAX_STACK_SIZE];
int node_top=-1;


void push_node(Node* node) {
    if (node_top >= MAX_STACK_SIZE - 1) {
        printf("Node Stack Overflow\n");
        exit(1);
    }
    node_stack[++node_top] = node;
}

Node* pop_node() {
    if (node_top == -1) {
        printf("Node Stack Underflow\n");
        exit(1);
    }
    return node_stack[node_top--];
}

Node* peek_node() {
    if (node_top == -1) {
        return NULL;
    }
    return node_stack[node_top];
}

Node* create_node(char data) {
    Node* new_node = (Node*)malloc(sizeof(Node));
    if (!new_node) {
        printf("Memory allocation failed\n");
        exit(1);
    }
    new_node->data = data;
    new_node->left = new_node->right = NULL;
    return new_node;
}

void create_subtree() {
    if (node_top < 1 || top == -1) return;
    Node* new_node = create_node(pop());
    new_node->right = pop_node();
    new_node->left = pop_node();
    push_node(new_node);
}

Node* infix_to_binary_tree(char* infix) {
    top = -1; 
    node_top = -1; 
    char ch;
    int i = 0;

    while ((ch = infix[i++]) != '\0') {
        if (ch == ' ') continue;

        if (isalnum(ch)) {
            Node* node = create_node(ch);
            push_node(node);
        }
        else if (ch == '(') {
            push(ch);
        }
        else if (ch == ')') {
            while (!isEmpty() && peek() != '(') {
                create_subtree();
            }
            if (!isEmpty() && peek() == '(') {
                pop(); 
            }
        }
        else if (is_operator(ch)) {
            while (!isEmpty() && peek() != '(' && precedence(peek()) >= precedence(ch)) {
                create_subtree();
            }
            push(ch);
        }
    }

    while (!isEmpty()) {
        create_subtree();
    }

    return node_top >= 0 ? pop_node() : NULL;
}

void inorder_traversal(Node* root) {
    if (root == NULL) return;
    inorder_traversal(root->left);
    printf("%c ", root->data);
    inorder_traversal(root->right);
}

void preorder_traversal(Node* root){
    if (root == NULL)return;
    printf("%c ",root->data);
    preorder_traversal(root->left);
    preorder_traversal(root->right);
}

void postorder_traversal(Node* root){
    if (root == NULL)return;
    postorder_traversal(root->left);
    postorder_traversal(root->right);
    printf("%c ",root->data);
}



void free_tree(Node* root) {
    if (root == NULL) return;
    free_tree(root->left);
    free_tree(root->right);
    free(root);
}


int main() {
    char infix[100];
    printf("Enter infix expression: ");
    fgets(infix, 100, stdin);
    infix[strcspn(infix, "\n")] = '\0';

    Node* root = infix_to_binary_tree(infix);
    while (1){

    if (root==NULL) {
        printf("Invalid expression\n");
	exit(1);
    }
    printf("choose  traversal method 1:infix,2:prefix,3:postfix:");
    int c;
    scanf("%d",&c);
    switch (c){
	case 1:{
		printf("inorder traversal \n");
		inorder_traversal(root);
		printf("\n");
		break;
	}case 2:{
		printf("preorder traversal \n");
		preorder_traversal(root);
		printf("\n");
		break;
	}case 3:{
		printf("postorder traversal \n");
		postorder_traversal(root);
		printf("\n");
		break;
	}
	case 4:{
		printf("exiting\n");
		free_tree(root);
		return 0;
	}
      }
    }
}
