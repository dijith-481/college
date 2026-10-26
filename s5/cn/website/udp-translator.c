#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char *abbr[] = {"tbh",  "ig",  "tbf",  "atm", "irl", "lol",
                      "asap", "omg", "ttyl", "idk", "nvm"};
const char *full[] = {
    "to be honest",        "i guess",      "to be fair",
    "at the moment",       "in real life", "laughing out loud",
    "as soon as possible", "oh my god",    "talk to you later",
    "i don't know",        "never mind"};

int main() {
  int sfd = socket(AF_INET, SOCK_DGRAM, 0);
  struct sockaddr_in saddr, caddr;
  socklen_t len = sizeof(caddr);
  char buf[1024], out[2048] = {0};

  saddr.sin_family = AF_INET;
  saddr.sin_port = htons(8080);
  saddr.sin_addr.s_addr = INADDR_ANY;

  bind(sfd, (struct sockaddr *)&saddr, sizeof(saddr));
  int n =
      recvfrom(sfd, buf, sizeof(buf) - 1, 0, (struct sockaddr *)&caddr, &len);
  buf[n] = '\0';

  char *token = strtok(buf, " ");
  while (token) {
    int found = -1;
    char clean[64];
    char punct = '\0';
    int tlen = strlen(token);

    if (token[tlen - 1] == ',' || token[tlen - 1] == '.') {
      punct = token[tlen - 1];
      strncpy(clean, token, tlen - 1);
      clean[tlen - 1] = '\0';
    } else {
      strcpy(clean, token);
    }

    for (int i = 0; i < 11; i++) {
      if (strcmp(clean, abbr[i]) == 0) {
        found = i;
        break;
      }
    }

    if (found != -1)
      strcat(out, full[found]);
    else
      strcat(out, clean);

    if (punct) {
      int olen = strlen(out);
      out[olen] = punct;
      out[olen + 1] = '\0';
    }
    strcat(out, " ");
    token = strtok(NULL, " ");
  }

  sendto(sfd, out, strlen(out), 0, (struct sockaddr *)&caddr, len);
  return 0;
}
