#include <stdio.h>

typedef struct {
  int row;
  int col;
  int val;
} sparse;

void sum(sparse s1[], sparse s2[], sparse sr[]) {
  sr[0].row = s1[0].row;
  sr[0].col = s1[0].col;
  int i = 1, j = 1, k = 1;
  while (i <= s1[0].val && j <= s2[0].val) {
    if (s1[i].row == s2[j].row) {
      if (s1[i].col == s2[j].col) {
        sr[k].row = s1[i].row;
        sr[k].col = s1[i].col;
        sr[k].val = s1[i].val + s2[j].val;
        i++;
        j++;
      } else if (s1[i].col < s2[j].col) {
        sr[k].row = s1[i].row;
        sr[k].col = s1[i].col;
        sr[k].val = s1[i].val;
        i++;
      } else {
        sr[k].row = s2[j].row;
        sr[k].col = s2[j].col;
        sr[k].val = s2[j].val;
        j++;
      }
    } else if (s1[i].row < s2[j].row) {
      sr[k].row = s1[i].row;
      sr[k].col = s1[i].col;
      sr[k].val = s1[i].val;
      i++;
    } else {
      sr[k].row = s2[j].row;
      sr[k].col = s2[j].col;
      sr[k].val = s2[j].val;
      j++;
    }
    k++;
  }
  while (i <= s1[0].val) {
    sr[k].row = s1[i].row;
    sr[k].col = s1[i].col;
    sr[k].val = s1[i].val;
    i++;
    k++;
  }
  while (j <= s2[0].val) {
    sr[k].row = s2[j].row;
    sr[k].col = s2[j].col;
    sr[k].val = s2[j].val;
    j++;
    k++;
  }
  sr[0].val = k - 1;
}

void display(sparse s[]) {
  printf("row \t col \t val \n");
  for (int i = 1; i <= s[0].val; i++) {
    printf("%d \t %d \t %d \n", s[i].row, s[i].col, s[i].val);
  }
}

void input(sparse s[]) {
  printf("enter items of matrix\n");
  for (int i = 1; i <= s[0].val; i++) {
    if (scanf("%d %d %d", &s[i].row, &s[i].col, &s[i].val) != 3) {
      printf("Input error. Exiting.\n");
      // Add error handling like exit(1) if necessary
    }
  }
}

int main() {
  int row, col, val;
  printf("enter rows cols and no of elements in matrix 1\n");
  if (scanf("%d %d %d", &row, &col, &val) != 3)
    return 1;
  sparse s1[val + 1];
  s1[0].row = row;
  s1[0].col = col;
  s1[0].val = val;
  input(s1);
  printf("enter rows cols and no of elements in matrix 2\n");
  if (scanf("%d %d %d", &row, &col, &val) != 3)
    return 1;
  sparse s2[val + 1];
  s2[0].row = row;
  s2[0].col = col;
  s2[0].val = val;
  input(s2);
  if (s1[0].row != s2[0].row || s1[0].col != s2[0].col) {
    printf("matrices are not compatible\n");
    return 0;
  }
  sparse sr[s1[0].val + s2[0].val + 1];
  sum(s1, s2, sr);
  display(sr);
  return 0;
}
