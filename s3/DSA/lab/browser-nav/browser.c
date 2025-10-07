#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Node {
    char url[100];
    struct Node* prev;
    struct Node* next;
};

struct Node* current = NULL;  

void visitNewPage(char url[]) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    strcpy(newNode->url, url);
    newNode->prev = current;
    newNode->next = NULL;

    if (current != NULL) {
        current->next = newNode;
    }

    current = newNode;
    printf("Visited: %s\n", current->url);
}

void goBack() {
    if (current == NULL || current->prev == NULL) {
        printf("Cannot go back. No previous page.\n");
    } else {
        current = current->prev;
        printf("Moved back to: %s\n", current->url);
    }
}

void goForward() {
    if (current == NULL || current->next == NULL) {
        printf("Cannot go forward. No next page.\n");
    } else {
        current = current->next;
        printf("Moved forward to: %s\n", current->url);
    }
}

void displayCurrentPage() {
    if (current == NULL) {
        printf("No page visited yet.\n");
    } else {
        printf("Current Page: %s\n", current->url);
    }
}


#define CLEAR_SCREEN "\033[2J\033[1;1H"
#define BG_WHITE "\033[47m"
#define FG_BLACK "\033[30m"
#define RESET "\033[0m"

int main() {
    int choice;
    char url[100] = "";

    do {
        printf("%s", CLEAR_SCREEN);
        printf("%s%s+--------------------------------------------------------------------------------------------------------+%s\n", BG_WHITE, FG_BLACK, RESET);
        printf("%s%s| %s %s[4] ↻ Refresh  [1] New TAB  | URL: %-30s | [5] Exit |%s\n", BG_WHITE, FG_BLACK,current!=NULL&&current->prev!=NULL?"[2] ◄ Back":"          " ,current!=NULL&&current->next!=NULL?"[3] ► Forward  ":"               " , current!=NULL ? current->url : "about:blank", RESET);
        printf("%s%s+--------------------------------------------------------------------------------------------------------+%s\n", BG_WHITE, FG_BLACK, RESET);
        printf("                                                                                                         %s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);
        printf("_________________________________________________________________________________________________________%s\n",   RESET);

        if (scanf("%d", &choice) != 1) {
            while (getchar() != '\n'); 
            printf("\nInvalid input. Press Enter to continue.");
            getchar();
            continue;
        }
        while (getchar() != '\n'); 

        switch(choice) {
            case 1:
                printf("\nEnter URL to visit: ");
                if (fgets(url, 100, stdin) != NULL) {
                    url[strcspn(url, "\n")] = 0; 
                    visitNewPage(url);
                } else {
                    printf("\nError reading URL. Press Enter to continue.");
                    getchar();
                }
                break;
            case 2:
                goBack();
                break;
            case 3:
                goForward();
                break;
            case 4:
                displayCurrentPage();
                break;
            case 5:
                printf("\nExiting Browser Simulation.\n");
                break;
            default:
                printf("\nInvalid choice. Press Enter to continue.");
                getchar();
        }
    } while(choice != 5);

    return 0;
}

