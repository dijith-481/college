#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int coeff;  
    int exp;    
    struct Node* next;
} Node;

struct Node* createNode(int coeff, int exp) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    if (newNode == NULL) {
        exit(1);
    }
    newNode->coeff = coeff;
    newNode->exp = exp;
    newNode->next = NULL; 
    return newNode; 
}

void insertSorted(struct Node** head, int coeff, int exp) {
    if (coeff == 0) return; // Skip zero coefficients

    struct Node* newNode = createNode(coeff, exp);
    struct Node* current = *head;
    struct Node* prev = NULL;

    // If list is empty or new node has higher exponent than head
    if (*head == NULL || (*head)->exp < exp) {
        newNode->next = *head;
        *head = newNode;
        return;
    }

    // Traverse to find the correct position
    while (current != NULL && current->exp > exp) {
        prev = current;
        current = current->next;
    }

    // If a term with the same exponent exists
    if (current != NULL && current->exp == exp) {
        current->coeff += coeff;
        free(newNode); // Free the new node as it's not needed
        if (current->coeff == 0) { // Remove node if coefficient becomes zero
            if (prev == NULL) {
                *head = current->next;
            } else {
                prev->next = current->next;
            }
            free(current);
        }
        return;
    }

    // Insert the new node at the correct position
    newNode->next = current;
    if (prev == NULL) {
        *head = newNode;
    } else {
        prev->next = newNode;
    }
}

struct Node* addPolynomials(struct Node* poly1, struct Node* poly2) {
    struct Node* result = NULL;
    struct Node* temp1 = poly1;
    struct Node* temp2 = poly2;

    // Add terms from both polynomials, merging by exponent
    while (temp1 != NULL || temp2 != NULL) {
        int coeff = 0, exp = 0;

        // Choose the term with the higher exponent
        if (temp1 != NULL && (temp2 == NULL || temp1->exp > temp2->exp)) {
            coeff = temp1->coeff;
            exp = temp1->exp;
            temp1 = temp1->next;
        } else if (temp2 != NULL && (temp1 == NULL || temp2->exp > temp1->exp)) {
            coeff = temp2->coeff;
            exp = temp2->exp;
            temp2 = temp2->next;
        } else if (temp1 != NULL && temp2 != NULL && temp1->exp == temp2->exp) {
            coeff = temp1->coeff + temp2->coeff;
            exp = temp1->exp;
            temp1 = temp1->next;
            temp2 = temp2->next;
        }

        // Insert the combined term if coefficient is non-zero
        if (coeff != 0) {
            insertSorted(&result, coeff, exp);
        }
    }

    return result;
}

struct Node* multiplyPolynomials(struct Node* poly1, struct Node* poly2) {
    struct Node* result = NULL;
    struct Node* temp1 = poly1;
    
    while (temp1 != NULL) {
        struct Node* temp2 = poly2;
        while (temp2 != NULL) {
            int newCoeff = temp1->coeff * temp2->coeff;
            int newExp = temp1->exp + temp2->exp;
            insertSorted(&result, newCoeff, newExp);
            temp2 = temp2->next;
        }
        temp1 = temp1->next;
    }
    return result;
}

void printPolynomial(struct Node* head) {
    if (head == NULL) {
        printf("0\n");
        return;
    }
    struct Node* temp = head;
    while (temp != NULL) {
        if (temp->coeff != 0) {
            if (temp != head && temp->coeff > 0) printf("+");
            if (temp->coeff != 1 || temp->exp == 0) printf("%d", temp->coeff);
            else if (temp->coeff == -1 && temp->exp != 0) printf("-");
            if (temp->exp > 0) printf("x");
            if (temp->exp > 1) printf("^%d", temp->exp);
            if (temp->next != NULL) printf(" ");
        }
        temp = temp->next;
    }
    printf("\n");
}

void freeList(struct Node** head) {
    struct Node* current = *head;
    while (current != NULL) {
        struct Node* temp = current;
        current = current->next;
        free(temp);
    }
    *head = NULL;
}

int main() {
    Node* poly1 = NULL;
    Node* poly2 = NULL;
    int choice, coeff, exp;

    do {
        printf("\nPolynomial Operations Menu:\n");
        printf("1. Insert term to Polynomial 1\n");
        printf("2. Insert term to Polynomial 2\n");
        printf("3. Add Polynomials\n");
        printf("4. Multiply Polynomials\n");
        printf("5. Display Polynomial 1\n");
        printf("6. Display Polynomial 2\n");
        printf("7. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                printf("Enter coefficient and exponent: ");
                scanf("%d %d", &coeff, &exp);
                insertSorted(&poly1, coeff, exp);
                break;
            case 2:
                printf("Enter coefficient and exponent: ");
                scanf("%d %d", &coeff, &exp);
                insertSorted(&poly2, coeff, exp);
                break;
            case 3: {
                struct Node* sum = addPolynomials(poly1, poly2);
                printf("Sum: ");
                printPolynomial(sum);
                freeList(&sum);
                break;
            }
            case 4: {
                struct Node* product = multiplyPolynomials(poly1, poly2);
                printf("Product: ");
                printPolynomial(product);
                freeList(&product);
                break;
            }
            case 5:
                printf("Polynomial 1: ");
                printPolynomial(poly1);
                break;
            case 6:
                printf("Polynomial 2: ");
                printPolynomial(poly2);
                break;
            case 7:
                printf("Exiting program.\n");
                freeList(&poly1);
                freeList(&poly2);
                break;
            default:
                printf("Invalid choice. Please try again.\n");
        }
    } while (choice != 7);

    return 0;
}
