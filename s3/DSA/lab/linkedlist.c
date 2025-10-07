#include <stdio.h>
#include <stdlib.h>

typedef struct Node{
	int val;
	struct Node* next;
}Node;

struct Node* createNode(int value) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));

    if (newNode == NULL) {
	exit(1);
    }

    newNode->val = value;
    newNode->next = NULL; 

    return newNode; 
}

void insertAtEnd(struct Node** head, int data) {
    struct Node* newNode = createNode(data);
    if (*head == NULL) {
        *head = newNode;
        return;
    }
    struct Node* temp = *head;
    while (temp->next != NULL) {
        temp = temp->next;
    }
    temp->next = newNode;
}


void insertAtBeginning(struct Node ** head,int data){
 	struct Node* newNode = createNode(data);
 	newNode->next = *head;
    	*head = newNode;
}



void insertAt(struct Node** head ,int data,int pos){
	if (pos ==0)
		insertAtBeginning(head,data);
	else{

		if (*head == NULL) {
        		printf("List is empty, nothing to delete.\n");
        		return;
		}
    		struct Node* temp = *head;
		for(int i=0;i<pos-1;i++){
			if(temp->next ==NULL){
        			printf("linked list doesnt have enough elements\n");
        			return;
			}
			temp=temp->next;
		}
    		struct Node* newNode = createNode(data);
		newNode->next=temp->next;
		temp->next=newNode;
		
		
	}
	

	
	
}



void deleteFromBeginning(struct Node** head) {
    if (*head == NULL) {
        printf("List is empty, nothing to delete.\n");
        return;
    }
    struct Node* temp = *head;
    *head = temp->next;
    free(temp);
}

void deleteAt(struct Node** head ,int pos){
    	if (*head == NULL) {
        	printf("List is empty, nothing to delete.\n");
        	return;
	}
	if (pos ==0)
		deleteFromBeginning(head);
	else{
    		struct Node* temp = *head;
		for(int i=0;i<pos-1;i++){
			if(temp->next ==NULL){
        			printf("linked list doesnt have enough elements\n");
        			return;
			}
			temp=temp->next;
		}
		if (temp->next == NULL) {
			printf("linked list doesnt have enough elements\n");
			return;
		}
    		struct Node* toDelete = temp->next;
		temp->next = toDelete->next;
		free(toDelete);
		
		
	}
	

	
	
}

void deleteFromEnd(struct Node** head) {
    if (*head == NULL) {
        printf("List is empty, nothing to delete.\n");
        return;
    }
    if ((*head)->next == NULL) { 
        free(*head);
        *head = NULL;
        return;
    }
    struct Node* temp = *head;
    struct Node* prev = NULL;
    while (temp->next != NULL) {
        prev = temp;
        temp = temp->next;
    }
    free(temp);
    prev->next = NULL;
}

void printList(struct Node* head) {
    struct Node* temp = head;
    while (temp != NULL) {
        printf("%d -> ", temp->val);
        temp = temp->next;
    }
    printf("NULL\n");
}


int main() {
    Node* head = NULL; 
    int choice, value,pos;

    do {
        printf("\nLinked List Menu:\n");
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
                insertAt(&head, value,pos);
                break;
	 case 4:
		deleteFromBeginning(&head);
                printf("deleted from beginning\n");
		break;
	 case 5:
		deleteFromEnd(&head);
                printf("deleted from end\n");
		break;
	 case 6:
		printf("Enter position to delete: ");
                scanf("%d", &pos);
		deleteAt(&head,pos);
                printf("deleted from position\n");
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
