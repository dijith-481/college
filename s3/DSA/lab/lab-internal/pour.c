#include <stdio.h>
#include <string.h>
#define MAX_STATES 10000

typedef struct {
  int a;
  int b;
  int c;
  int parent;

} State;

State node_stack[MAX_STATES];
int node_top, rear;
int visited[11][8][5];

const int cap_a = 10, cap_b = 7, cap_c = 4;

void node_push(int a, int b, int c, int parent) {
  if (a < 0 || a > cap_a || b < 0 || b > cap_b || c < 0 || c > cap_c ||
      visited[a][b][c] == 1)
    return;
  visited[a][b][c] = 1;
  node_stack[rear].a = a;
  node_stack[rear].b = b;
  node_stack[rear].c = c;
  node_stack[rear].parent = parent;
  rear++;
}

void print_path(int goal) {
  int path[100];
  int len = 0;
  int idx = goal;
  while (idx != -1) {
    path[len++] = idx;
    idx = node_stack[idx].parent;
  }
  for (int i = len - 1; i >= 0; i--) {
    printf("(%d,%d,%d)\n", node_stack[path[i]].a, node_stack[path[i]].b,
           node_stack[path[i]].c);
  }
}

int bfs() {
  node_top = 0, rear = 0;
  memset(visited, 0, sizeof(visited));
  node_push(0, 7, 4, -1);
  while (node_top < rear) {
    State s = node_stack[node_top];
    node_top++;
    if (s.b == 2 || s.c == 2) {
      print_path(node_top - 1);
      return 1;
    }
    int a = s.a, b = s.b, c = s.c;
    int amount = b + a < cap_b ? a : cap_b - b;
    node_push(a - amount, b + amount, c, node_top - 1);
    amount = c + a < cap_c ? a : cap_c - c;
    node_push(a - amount, b, c + amount, node_top - 1);
    amount = a + b < cap_a ? b : cap_a - a;
    node_push(a + amount, b - amount, c, node_top - 1);
    amount = c + b < cap_c ? b : cap_c - c;
    node_push(a, b - amount, c + amount, node_top - 1);
    amount = a + c < cap_a ? c : cap_a - a;
    node_push(a + amount, b, c - amount, node_top - 1);
    amount = b + c < cap_b ? c : cap_b - b;
    node_push(a, b + amount, c - amount, node_top - 1);
  }
  return 0;
}

int main() {
  if (bfs()) {
    printf("yes\n");
  } else {
    printf("no\n");
  }
  return 0;
}
