#include <stdio.h>
#include <string.h>
struct book {
  int bookID;
  char bookName[20];
  char authorName[20];
  int quantity;
};
int printingOrder(struct book bookarr[], int length, int times) {
  int greatest = bookarr[0].quantity;
  int greatestIndex = 0;
  for (int i = 0; i < length; i++) {
    if (bookarr[i].quantity > greatest) {
      greatest = bookarr[i].quantity;
      greatestIndex = i;
      printf("%d\n", greatest);
    }
  }
  printf("%d\t%s\t%s\t%d\n", bookarr[greatestIndex].bookID,
         bookarr[greatestIndex].bookName, bookarr[greatestIndex].authorName,
         bookarr[greatestIndex].quantity);
  times++;
  bookarr[greatestIndex].quantity = -1;
  if (times == length) {
    return 0;
  } else {
    return printingOrder(bookarr, length, times);
  }
}
int main() {
  int num;
  printf("Enter the number of books: ");
  scanf("%d", &num);
  struct book bookArray[num];
  for (int i = 0; i < num; i++) {
    printf("Enter Book ID: ");
    scanf("%d", &bookArray[i].bookID);
    printf("Enter Book name: ");
    scanf("%s", bookArray[i].bookName);
    printf("Enter Author's name: ");
    scanf("%s", bookArray[i].bookName);
    printf("Enter Number of copies: ");
    scanf("%d", &bookArray[i].quantity);
  }

  printf("Book ID\tName\tAuthor\tNumber of Copies\n");
  printingOrder(bookArray, num, 0);
}
