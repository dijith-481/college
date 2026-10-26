#include <arpa/inet.h>
#include <stdio.h>
#include <string.h>

int main() {
  int cfd = socket(AF_INET, SOCK_DGRAM, 0);
  struct sockaddr_in saddr;
  char buf[1024];

  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(8080);
  inet_pton(AF_INET, "127.0.0.1", &saddr.sin_addr);

  printf("Enter sentence: ");
  fgets(buf, sizeof(buf), stdin);
  buf[strcspn(buf, "\n")] = 0;

  sendto(cfd, buf, strlen(buf), 0, (struct sockaddr *)&saddr, sizeof(saddr));
  int n = recvfrom(cfd, buf, sizeof(buf) - 1, 0, NULL, NULL);
  buf[n] = '\0';

  printf("Translated: %s\n", buf);
  return 0;
}
