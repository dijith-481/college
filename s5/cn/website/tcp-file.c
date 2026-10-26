#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main() {
  int sfd = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in saddr, caddr;
  socklen_t len = sizeof(caddr);

  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(7070);
  saddr.sin_addr.s_addr = INADDR_ANY;

  bind(sfd, (struct sockaddr *)&saddr, sizeof(saddr));
  listen(sfd, 5);

  while (1) {
    int cfd = accept(sfd, (struct sockaddr *)&caddr, &len);
    if (fork() == 0) {
      close(sfd);
      char fname[128], buf[1024];
      int n = read(cfd, fname, sizeof(fname) - 1);
      fname[n] = '\0';

      pid_t pid = getpid();
      FILE *fp = fopen(fname, "r");
      if (!fp) {
        snprintf(buf, sizeof(buf),
                 "[Server PID: %d] Error: File '%s' not found\n", pid, fname);
        write(cfd, buf, strlen(buf));
      } else {
        snprintf(buf, sizeof(buf), "[Server PID: %d] File Contents:\n", pid);
        write(cfd, buf, strlen(buf));
        while ((n = fread(buf, 1, sizeof(buf), fp)) > 0) {
          write(cfd, buf, n);
        }
        fclose(fp);
      }
      close(cfd);
      exit(0);
    }
    close(cfd);
  }
  return 0;
}
