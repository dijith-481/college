#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX_STATES 10000


typedef struct {
    int a, b, c;
    int parent;
    int pour_from, pour_to; 
} State;

State queue[MAX_STATES];
int front, rear;
int visited[11][8][5]; 


const int cap_a = 10, cap_b = 7, cap_c = 4;


void enqueue(int a, int b, int c, int parent, int from, int to) {
    if (a < 0 || a > cap_a || b < 0 || b > cap_b || c < 0 || c > cap_c || visited[a][b][c])
        return;
    visited[a][b][c] = 1;
    queue[rear].a = a;
    queue[rear].b = b;
    queue[rear].c = c;
    queue[rear].parent = parent;
    queue[rear].pour_from = from;
    queue[rear].pour_to = to;
    rear++;
}


void try_pour(int a, int b, int c, int parent, int from, int to) {
    int amount;
    if (from == 1 && to == 2) { 
        amount = (b + a < cap_b) ? a : (cap_b - b);
        enqueue(a - amount, b + amount, c, parent, from, to);
    } else if (from == 1 && to == 3) { 
        amount = (c + a < cap_c) ? a : (cap_c - c);
        enqueue(a - amount, b, c + amount, parent, from, to);
    } else if (from == 2 && to == 1) { 
        amount = (a + b < cap_a) ? b : (cap_a - a);
        enqueue(a + amount, b - amount, c, parent, from, to);
    } else if (from == 2 && to == 3) { 
        amount = (c + b < cap_c) ? b : (cap_c - c);
        enqueue(a, b - amount, c + amount, parent, from, to);
    } else if (from == 3 && to == 1) { 
        amount = (a + c < cap_a) ? c : (cap_a - a);
        enqueue(a + amount, b, c - amount, parent, from, to);
    } else if (from == 3 && to == 2) { 
        amount = (b + c < cap_b) ? c : (cap_b - b);
        enqueue(a, b + amount, c - amount, parent, from, to);
    }
}


void print_pour(int from, int to) {
    char *jugs[] = {"", "10L", "7L", "4L"};
    printf("Pour from %s to %s\n", jugs[from], jugs[to]);
}


void print_path(int goal_idx) {
    int path[100], len = 0, idx = goal_idx;
    while (idx != -1) {
        path[len++] = idx;
        idx = queue[idx].parent;
    }
    printf("Solution found in %d steps:\n", len - 1);
    for (int i = len - 1; i >= 0; i--) {
        printf("State: (%d, %d, %d)", queue[path[i]].a, queue[path[i]].b, queue[path[i]].c);
        if (i < len - 1)
            print_pour(queue[path[i]].pour_from, queue[path[i]].pour_to);
        printf("\n");
    }
}


int bfs() {
    front = rear = 0;
    memset(visited, 0, sizeof(visited));

    
    enqueue(0, 7, 4, -1, 0, 0);

    while (front < rear) {
        State s = queue[front++];

        
        if (s.b == 2 || s.c == 2) {
            print_path(front - 1);
            return 1;
        }

       
        for (int from = 1; from <= 3; from++)
            for (int to = 1; to <= 3; to++)
                if (from != to)
                    try_pour(s.a, s.b, s.c, front - 1, from, to);
    }
    return 0;
}

int main() {
    if (bfs())
        printf("Goal achieved!\n");
    else
        printf("No solution found.\n");
    return 0;
}
