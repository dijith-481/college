#include<stdio.h>

int linearsearch(int nums[],int n,int s){
	for (int i=0;i<n;i++){
		if (nums[i] ==s){
			return i;
		}
	}
	return -1;
}

int main(){
	printf("enter no of elements : ");
	int n;
	scanf("%d",&n);
	int nums[n];
	for (int i=0;i<n;i++){
		scanf("%d",&nums[i]);
	}
	printf("enter element to search : ");
	int s;
	scanf("%d",&s);
	int pos =linearsearch(nums,n,s);
	if (pos == -1){
		printf("element not found\n");
	}else{
		printf("element foun at index %d\n",pos);
	}
	
}
