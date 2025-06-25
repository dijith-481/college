#include <stdio.h>
#define FACT(n)                                                                \
  ({                                                                           \
    int fact = 1;                                                              \
    for (int i = 1; i <= n; i++) {                                             \
      fact *= i;                                                               \
    }                                                                          \
    fact;                                                                      \
  })
#define NCR(n, r) ({ FACT(n) / (FACT(n - r) * (FACT(r))); })
int main() {
  int n = NCR(5, 0);
  printf("%d", n);
}
/* #include <stdio.h> */
/* #define FACT(n)                                                     \ */
/*   ({                                                                \ */
/*     int fact = 1;                                                   \ */
/*     for (int i = 1; i <= n; i++) {                                  \ */
/*       fact *= i;                                                    \ */
/*     }                                                               \ */
/*     fact;                                                           \ */
/*   }) */
/* #define NCR(n, r) (FACT(n) / (FACT(n - r) * FACT(r))) */
/* int main() { int n = NCR(5, 3); printf("%d\n", n); return 0; } */
