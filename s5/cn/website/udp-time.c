#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

int main() {
  int sfd = socket(AF_INET, SOCK_DGRAM, 0);
  struct sockaddr_in saddr, caddr;
  socklen_t len = sizeof(caddr);
  char buf[128];

  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(9090);
  saddr.sin_addr.s_addr = INADDR_ANY;

  bind(sfd, (struct sockaddr *)&saddr, sizeof(saddr));

  while (1) {
    recvfrom(sfd, buf, sizeof(buf), 0, (struct sockaddr *)&caddr, &len);
    if (fork() == 0) {
      time_t t = time(NULL);
      char *tm_str = ctime(&t);
      sendto(sfd, tm_str, strlen(tm_str), 0, (struct sockaddr *)&caddr, len);
      exit(0);
    }
  }
  return 0;
}
