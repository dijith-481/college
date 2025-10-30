#include <stdio.h>

struct sparse {
  int row;
  int col;
  int val;
};

typedef struct sparse Sparse;
void add_sparse(Sparse s1[], Sparse s2[], Sparse sr[]) {
  sr[0].row = s1[0].row;
  sr[0].col = s1[0].col;
  int i = 1;
  int j = 1;
  int k = 1;
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
  sr[0].val = k;
}

void display(Sparse m[]) {
  printf("row\tcol\tval\n");
  for (int i = 0; i <= m[0].val; i++) {
    printf("%d\t%d\t%d\n", m[i].row, m[i].col, m[i].val);
  }
}

void input(Sparse m[]) {
  for (int i = 1; i <= m[0].val; i++) {
    printf("enter row: ");
    scanf("%d", &m[i].row);
    printf("enter col: ");
    scanf("%d", &m[i].col);
    printf("enter value: ");
    scanf("%d", &m[i].val);
  }
}

int main() {
  printf("enter rows cols and value for m1: ");
  int r, c, v;
  scanf("%d%d%d", &r, &c, &v);
  Sparse s1[v + 1];
  s1[0].row = r;
  s1[0].col = c;
  s1[0].val = v;

  printf("enter rows cols and value for m2: ");
  scanf("%d%d%d", &r, &c, &v);
  Sparse s2[v + 1];
  s2[0].row = r;
  s2[0].col = c;
  s2[0].val = v;

  if (s1[0].col != s2[0].col || s1[0].row != s2[0].row) {
    printf("to add matrix the rows and colums must be equal\n");
    return 0;
  }

  printf("enter terms in first sparse matrix\n");
  input(s1);
  printf("enter terms in second sparse matrix\n");
  input(s2);
  Sparse sr[s1[0].val + s2[0].val + 1];
  printf("sparse matrix  1\n");
  display(s1);
  printf("sparse matrix  2\n");
  display(s2);
  add_sparse(s1, s2, sr);
  printf("sparse matrix addition\n");
  display(sr);
}
