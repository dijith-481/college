#include<stdio.h>
#include "queue.c"
#define MAX(a,b) ((a)>(b)?(a):(b))


int find_max(int q[],int *front,int *rear,int max_size){
	int max_item=dequeue(q,front,rear);
	int new_q[max_size];
	int new_rear=-1;
	int new_front=-1;
	while (*rear!=-1){
		int item =dequeue(q,front,rear);
		max_item = MAX(item,max_item);
		enque(new_q,&new_front,&new_rear,max_size,item);
	}
	while (new_rear!=-1){
		int item =dequeue(new_q,&new_front,&new_rear);
		enque(q,front,rear,max_size,item);
	}
	return max_item;
}

void print(int q[],int max_size){
	for (int i=0;i<max_size;i++){
		printf("%d\n",q[i]);
	}
	
}

int main(){
	int max_size;
	printf("enter max size:");
	scanf("%d",&max_size);
	int q[max_size];
	int front =-1;
	int rear=-1;
	printf("enter elements of the queue:");
	for (int i=0;i<max_size;i++){
		int item ;
		scanf("%d",&item);
		enque(q,&front,&rear,max_size,item);
	}
	printf("queue elements \n");
	print(q,max_size);
	int max_item = find_max(q,&front,&rear,max_size);
	printf("max item   %d\n",max_item);
}
