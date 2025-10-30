#include <stdio.h>
typedef struct {
  int coeff;
  int exp;
} Poly;

void add(Poly p1[], Poly p2[], Poly ps[], int n1, int n2, int *nr) {
  int i = 0, j = 0, k = 0;
  while (i < n1 && j < n2) {
    if (p1[i].exp > p2[j].exp) {
      ps[k].coeff = p1[i].coeff;
      ps[k].exp = p1[i].exp;
      i++;
    } else if (p1[i].exp < p2[j].exp) {
      ps[k].coeff = p2[j].coeff;
      ps[k].exp = p2[j].exp;
      j++;
    } else {
      ps[k].coeff = p1[i].coeff + p2[j].coeff;
      ps[k].exp = p1[i].exp;
      i++;
      j++;
    }
    k++;
    *nr = k;
  }
  while (i < n1) {
    ps[k].coeff = p1[i].coeff;
    ps[k].exp = p1[i].exp;
    i++;
    k++;
  }
  while (j < n2) {
    ps[k].coeff = p2[j].coeff;
    ps[k].exp = p2[j].exp;
    j++;
    k++;
  }
}

void display(Poly p[], int n) {
  int i;
  for (i = 0; i < n; i++) {
    printf("%dx^%d\n", p[i].coeff, p[i].exp);
  }
}

void input(Poly p[], int n) {
  int i;
  for (i = 0; i < n; i++) {
    scanf("%d%d", &p[i].coeff, &p[i].exp);
  }
}

int main() {
  printf("Enter the number of terms in the first polynomial\n");
  int n1;
  scanf("%d", &n1);
  Poly p1[n1];
  input(p1, n1);
  printf("Enter the number of terms in the second polynomial\n");
  int n2;
  scanf("%d", &n2);
  Poly p2[n2];
  input(p2, n2);
  Poly ps[n1 + n2];
  int nr;
  add(p1, p2, ps, n1, n2, &nr);
  display(ps, nr);
  return 0;
}
