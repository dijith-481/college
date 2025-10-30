#include<stdio.h>


void bubbleSort(int * arr,int n){
  for (int i=0;i<n;i++){
    for (int j=1;j<n-i-1;j++){
      if(arr[j]<arr[j-1]){
        arr[j]^=arr[j-1];
        arr[j-1]^=arr[j];
        arr[j]^=arr[j-1];
      }
    }
  }
}

int maxActivity(int *arr,int n,int k){
  bubbleSort(arr, n);
  int maxpoints=0;
  int i=0;
  while(i<k){
    maxpoints+=arr[i];
    i++;
  }
  return maxpoints;
}


  
  
int main() {
int n,m;
printf("Enter number of events: ");
scanf("%d", &n);
int A[n];
printf("Enter activity points for each event:\n");
for (int i = 0; i < n; i++) {
scanf("%d", &A[i]);
}
printf("Enter maximum events you can participate in : ");
scanf("%d", &m);
int maxPoints = maxActivity(A,  n, m);

printf("Maximum Activity Points: %d\n", maxPoints);
return 0;
}
