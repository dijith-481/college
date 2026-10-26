#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main() {
  int cfd = socket(AF_INET, SOCK_STREAM, 0);
  struct sockaddr_in saddr;
  char fname[128], buf[1024];

  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(7070);
  inet_pton(AF_INET, "127.0.0.1", &saddr.sin_addr);

  connect(cfd, (struct sockaddr *)&saddr, sizeof(saddr));
  printf("Enter filename: ");
  scanf("%s", fname);
  write(cfd, fname, strlen(fname));

  int n;
  while ((n = read(cfd, buf, sizeof(buf) - 1)) > 0) {
    buf[n] = '\0';
    printf("%s", buf);
  }
  close(cfd);
  return 0;
}
