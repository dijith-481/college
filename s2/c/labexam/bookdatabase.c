#include <stdio.h>
struct books {
  int id;
  char name[30];
  char author[30];
  int quantity;
};
int main() {
  printf("enter  no of books: ");
  int n;
  scanf("%d", &n);
  struct books books[n];
  for (int i = 0; i < n; i++) {
    printf("enter book id: ");
    scanf("%d", &books[i].id);
    printf("enter  name: ");
    scanf("%s", books[i].name);
    printf("enter book author: ");
    scanf("%s", books[i].author);
    printf("enter book quantity: ");
    scanf("%d", &books[i].quantity);
  }
  printf("id\tname\tauthor\tquantity\n");
  for (int i = 0; i < n; i++) {
    int largest = i;
    for (int j = i + 1; j < n; j++) {
      if (books[j].quantity > books[largest].quantity) {
        largest = j;
      }
    }
    printf("%d\t%s\t%s\t%d\n", books[largest].id, books[largest].name,
           books[largest].author, books[largest].quantity);
    books[largest] = books[i];
  }
}
