#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct node {
  char word[100];
  char meaning[100];
  struct node *next;
  struct node *right;

} Word;

Word *createWord(char *word, char *meaning) {
  Word *newWord = (Word *)malloc(sizeof(Word));
  if (newWord == NULL) {
    printf("Error in createWord\n");
    exit(1);
  }
  strcpy(newWord->word, word);
  strcpy(newWord->meaning, meaning);
  newWord->next = NULL;
  newWord->right = NULL;
  return newWord;
}

Word *insert(Word *root, char *word, char *meaning) {
  if (root == NULL) {
    return createWord(word, meaning);
  }
  if (strcmp(word, root->word) < 0) {
    root->next = insert(root->next, word, meaning);
  } else if (strcmp(word, root->word) > 0) {
    root->right = insert(root->right, word, meaning);
  } else {
    strcpy(root->meaning, meaning);
  }
  return root;
}

Word *search(Word *root, char *word) {
  if (root == NULL) {
    return NULL;
  }
  if (strcmp(word, root->word) == 0) {
    return root;
  }
  if (strcmp(word, root->word) < 0) {
    return search(root->next, word);
  } else {
    return search(root->right, word);
  }
}

void inorder(Word *root) {
  if (root == NULL) {
    return;
  }
  inorder(root->next);
  printf("%s %s\n", root->word, root->meaning);
  inorder(root->right);
}

int main() {
  Word *root = NULL;
  char word[100], meaning[100];
  while (1) {
    int option;
    printf("select option:\n1.insert\n2.search\n3.inorder\n4.exit\n");
    scanf("%d", &option);
    switch (option) {
    case 1:
      printf("enter word: ");
      scanf("%s", word);
      printf("enter meaning: ");
      scanf("%s", meaning);
      root = insert(root, word, meaning);
      break;
    case 2:
      printf("enter word: ");
      scanf("%s", word);
      root = search(root, word);
      if (root == NULL) {
        printf("word not found\n");
      } else {
        printf("meaning: %s\n", root->meaning);
      }
      break;
    case 3:
      inorder(root);
      break;
    case 4:
      exit(0);
      break;
    default:
      printf("invalid option\n");
      break;
    }
  }
}
