#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node* next;
    struct Node* prev;
} Node;

Node* createNode(int value) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    if (newNode == NULL) {
        exit(1);
    }
    newNode->val = value;
    newNode->next = NULL;
    newNode->prev = NULL;
    return newNode;
}

void insertAtEnd(Node** head, int data) {
    Node* newNode = createNode(data);
    if (*head == NULL) {
        *head = newNode;
        return;
    }
    Node* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = newNode;
    newNode->prev = temp;
}

void insertAtBeginning(Node** head, int data) {
    Node* newNode = createNode(data);
    newNode->next = *head;
    if (*head != NULL) {
        (*head)->prev = newNode;
    }
    *head = newNode;
}

void insertAt(Node** head, int data, int pos) {
    if (pos == 0) {
        insertAtBeginning(head, data);
        return;
    }
    if (*head == NULL) {
        printf("List is empty, inserting at beginning.\n");
        insertAtBeginning(head, data);
        return;
    }
    Node* temp = *head;
    for (int i = 0; i < pos - 1; i++) {
        if (temp->next == NULL) {
            printf("Linked list doesn't have enough elements, inserting at end.\n");
            insertAtEnd(head, data);
            return;
        }
        temp = temp->next;
    }
    Node* newNode = createNode(data);
    newNode->next = temp->next;
    newNode->prev = temp;
    if (temp->next != NULL) {
        temp->next->prev = newNode;
    }
    temp->next = newNode;
}

void deleteFromBeginning(Node** head) {
    if (*head == NULL) {
        printf("List is empty, nothing to delete.\n");
        return;
    }
    Node* temp = *head;
    *head = temp->next;
    if (*head != NULL) {
        (*head)->prev = NULL;
    }
    free(temp);
}

void deleteAt(Node** head, int pos) {
    if (*head == NULL) {
        printf("List is empty, nothing to delete.\n");
        return;
    }
    if (pos == 0) {
        deleteFromBeginning(head);
        return;
    }
    Node* temp = *head;
    for (int i = 0; i < pos; i++) {
        if (temp == NULL) {
            printf("Linked list doesn't have enough elements.\n");
            return;
        }
        temp = temp->next;
    }
    if (temp == NULL) {
        printf("Linked list doesn't have enough elements.\n");
        return;
    }
    if (temp->prev != NULL) {
        temp->prev->next = temp->next;
    }
    if (temp->next != NULL) {
        temp->next->prev = temp->prev;
    }
    free(temp);
}

void deleteFromEnd(Node** head) {
    if (*head == NULL) {
        printf("List is empty, nothing to delete.\n");
        return;
    }
    if ((*head)->next == NULL) {
        free(*head);
        *head = NULL;
        return;
    }
    Node* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->prev->next = NULL;
    free(temp);
}

void printList(Node* head) {
    Node* temp = head;
    while (temp != NULL) {
        printf("%d <-> ", temp->val);
        temp = temp->next;
    }
    printf("NULL\n");
}

int main() {
    Node* head = NULL;
    int choice, value, pos;

    do {
        printf("\nDoubly Linked List Menu:\n");
        printf("1. Insert at Beginning\n");
        printf("2. Insert at End\n");
        printf("3. Insert at any\n");
        printf("4. Delete at Beginning\n");
        printf("5. Delete at End\n");
        printf("6. Delete at any\n");
        printf("7. Display List\n");
        printf("8. Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                printf("Enter value to insert: ");
                scanf("%d", &value);
                insertAtBeginning(&head, value);
                break;
            case 2:
                printf("Enter value to insert: ");
                scanf("%d", &value);
                insertAtEnd(&head, value);
                break;
            case 3:
                printf("Enter value to insert: ");
                scanf("%d", &value);
                printf("Enter position to insert: ");
                scanf("%d", &pos);
                insertAt(&head, value, pos);
                break;
            case 4:
                deleteFromBeginning(&head);
                printf("Deleted from beginning\n");
                break;
            case 5:
                deleteFromEnd(&head);
                printf("Deleted from end\n");
                break;
            case 6:
                printf("Enter position to delete: ");
                scanf("%d", &pos);
                deleteAt(&head, pos);
                printf("Deleted from position\n");
                break;
            case 7:
                printList(head);
                break;
            case 8:
                printf("Exiting program.\n");
                break;
            default:
                printf("Invalid choice. Please try again.\n");
        }
    } while (choice != 8);

    return 0;
}
