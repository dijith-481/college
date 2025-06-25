#include <stdio.h>
struct student {
  char name[30];
  int adm_no;
  int roll_no;
};
int main() {
  printf("enter no of student: ");
  int n;
  scanf("%d", &n);
  struct student s[n];
  for (int i = 0; i < n; i++) {
    printf("enter admno");
    scanf("%d", &s[i].adm_no);
    printf("enter name");
    scanf("%s", s[i].name);
    s[i].roll_no = i + 1;
  }
  for (int i = 0; i < n; i++) {
    printf("%d %d %s", s[i].roll_no, s[i].adm_no, s[i].name);
  }
}
