#include <stdio.h>
#include <stdlib.h>
#include <string.h>


#define MAX_WORD 50
#define MAX_MEANING 200


typedef struct {
    char word[MAX_WORD];
    char meaning[MAX_MEANING];
} DictionaryEntry;


typedef struct Node {
    DictionaryEntry entry;
    struct Node* left;
    struct Node* right;
} Node;


Node* createNode(char* word, char* meaning) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    if (newNode == NULL) {
        printf("Memory allocation failed!\n");
        exit(1);
    }
    strncpy(newNode->entry.word, word, MAX_WORD - 1);
    newNode->entry.word[MAX_WORD - 1] = '\0';
    strncpy(newNode->entry.meaning, meaning, MAX_MEANING - 1);
    newNode->entry.meaning[MAX_MEANING - 1] = '\0';
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}


Node* insert(Node* root, char* word, char* meaning) {
    if (root == NULL) {
        return createNode(word, meaning);
    }

    int cmp = strcmp(word, root->entry.word);
    if (cmp < 0) {
        root->left = insert(root->left, word, meaning);
    } else if (cmp > 0) {
        root->right = insert(root->right, word, meaning);
    } else {
        
        strncpy(root->entry.meaning, meaning, MAX_MEANING - 1);
        root->entry.meaning[MAX_MEANING - 1] = '\0';
    }
    return root;
}


Node* search(Node* root, char* word) {
    if (root == NULL || strcmp(root->entry.word, word) == 0) {
        return root;
    }

    if (strcmp(word, root->entry.word) < 0) {
        return search(root->left, word);
    }
    return search(root->right, word);
}


void freeTree(Node* root) {
    if (root == NULL) return;
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

void inorder_traversal(Node* root) {
    if (root == NULL) return;
    inorder_traversal(root->left);
    printf("%s : %s ", root->entry.word,root->entry.meaning);
    inorder_traversal(root->right);
}


int main() {
    Node* root = NULL;
    int choice;
    char word[MAX_WORD];
    char meaning[MAX_MEANING];

    while (1) {
        printf("\nDictionary Menu:\n");
        printf("1. Insert word\n");
        printf("2. Search word\n");
        printf("3. traversal \n");
        printf("4. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);
        getchar(); 

        switch (choice) {
            case 1:
                printf("Enter word: ");
                fgets(word, MAX_WORD, stdin);
                word[strcspn(word, "\n")] = 0; 
                printf("Enter meaning: ");
                fgets(meaning, MAX_MEANING, stdin);
                meaning[strcspn(meaning, "\n")] = 0; 
                root = insert(root, word, meaning);
                printf("Word inserted successfully!\n");
                break;

            case 2:
                printf("Enter word to search: ");
                fgets(word, MAX_WORD, stdin);
                word[strcspn(word, "\n")] = 0; 
                Node* result = search(root, word);
                if (result != NULL) {
                    printf("Word: %s\nMeaning: %s\n", result->entry.word, result->entry.meaning);
                } else {
                    printf("Word not found!\n");
                }
                break;

            case 3:
		inorder_traversal(root);
		break;
	    case 4:
                freeTree(root);
                printf("Exiting program.\n");
                return 0;



            default:
                printf("Invalid choice!\n");
        }
    }
}
