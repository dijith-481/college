#include <stdio.h>

#define MAX_ITEMS 100

int arr[MAX_ITEMS];
int n;

int binary_search(int item, int start, int end) {
  if (start == end)
    return -1;
  int mid = (start + end) / 2;
  if (arr[mid] == item)
    return mid;
  if (arr[mid] < item) {
    return binary_search(item, mid + 1, end);
  }
  return binary_search(item, 0, mid);
}

int main(){
  int n;
  int i=0;
  while(scanf("%d",&n)==1){
    if(n==-1){
      break;
    }
    arr[i]=n;
    i++;
  }
  printf("enter element to search");
  scanf("%d",&n);
  int found=binary_search(n, 0,i);
  if (found!=-1){
    printf("element found at index %d\n",found);
  }else{
    printf("element not found\n");
    
  }
}
