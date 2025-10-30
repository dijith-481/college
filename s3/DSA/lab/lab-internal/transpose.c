#include <stdio.h>
typedef struct {
  int row;
  int col;
  int val;
} Sparse;

void transpose(Sparse s[]) {
  int r = s[0].row;
  s[0].row = s[0].col;
  s[0].col = r;
  for (int i = 1; i <= s[0].val; i++) {
    int min = i;
    for (int j = i + 1; j <= s[0].val; j++) {
      if (s[min].col > s[j].col ||
          (s[j].col == s[min].col && s[min].row > s[j].row)) {
        min = j;
      }
    }
    if (min == i) {
      int temp = s[i].row;
      s[i].row = s[i].col;
      s[i].col = temp;
      continue;
    }
    Sparse temp;
    temp.val = s[i].val;
    temp.col = s[i].col;
    temp.row = s[i].row;
    s[i].val = s[min].val;
    s[i].col = s[min].row;
    s[i].row = s[min].col;
    s[min].val = temp.val;
    s[min].col = temp.col;
    s[min].row = temp.row;
  }
}

void display(Sparse s[]) {
  printf("row\tcol\tval\n");
  for (int i = 0; i <= s[0].val; i++) {
    printf("%d\t%d\t%d\n", s[i].row, s[i].col, s[i].val);
  }
}

int main() {
  printf("enter rows,columns,and no of elements\n");
  int r, c, n;
  scanf("%d%d%d", &r, &c, &n);
  Sparse s[n + 1];
  s[0].row = r;
  s[0].col = c;
  s[0].val = n;
  for (int i = 1; i <= n; i++) {
    scanf("%d%d%d", &s[i].row, &s[i].col, &s[i].val);
  }
  display(s);
  transpose(s);
  display(s);
  return 0;
}
