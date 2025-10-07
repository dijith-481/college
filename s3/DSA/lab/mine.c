#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX 100
#define INF 999999

int n, m;
int maze[MAX][MAX];
int dist[MAX][MAX];
int queue[MAX * MAX][2];
int front, rear;
int dx[4] = {0, 0, -1, 1}; 
int dy[4] = {-1, 1, 0, 0};

void bfs() {
    front = rear = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            dist[i][j] = INF;

    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++)
            if (maze[i][j] == -1) {
                queue[rear][0] = i;
                queue[rear][1] = j;
                dist[i][j] = 0;
                rear++;
            }

    while (front < rear) {
        int x = queue[front][0];
        int y = queue[front][1];
        front++;

        for (int i = 0; i < 4; i++) {
            int nx = x + dx[i];
            int ny = y + dy[i];

            if (nx >= 0 && nx < n && ny >= 0 && ny < m && maze[nx][ny] == 0 && dist[nx][ny] == INF) {
                dist[nx][ny] = dist[x][y] + 1;
                queue[rear][0] = nx;
                queue[rear][1] = ny;
                rear++;
            }
        }
    }
}

int main() {
    printf("enter width and height: ");
    scanf("%d %d", &n, &m);
    char c;
    printf("enter maze: \n M is mine # is blocked all others are traversable\n ");
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            scanf(" %c", &c);
            if (c == '#') maze[i][j] = 1; 
            else if (c == 'M') maze[i][j] = -1; 
            else maze[i][j] = 0;
        }

    bfs();

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (maze[i][j] == -1) printf("M ");
            else if (maze[i][j] == 1) printf("# ");
            else if (dist[i][j] == INF) printf("X "); 
            else printf("%d ", dist[i][j]);
        }
        printf("\n");
    }

    return 0;
}
