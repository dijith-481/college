#include<stdio.h>
#include "queue.c"

void recursive_queue_rev(int q[],int *front,int *rear,int max_size){
		if (*rear == -1)
			return;
		int item = dequeue(q,front,rear);
		recursive_queue_rev(q,front,rear,max_size);
		enque(q,front,rear,max_size,item);
}
void print(int q[],int max_size){
	for (int i=0;i<max_size;i++){
		printf("%d\n",q[i]);
	}
	
}

int main(){
	int max_size=3;
	int q[max_size];
	int front =-1;
	int rear=-1;
	printf("enter elements of the queue:");
	for (int i=0;i<max_size;i++){
		int item ;
		scanf("%d",&item);
		enque(q,&front,&rear,max_size,item);
	}
	printf("queue before reversing\n");
	print(q,max_size);
	recursive_queue_rev(q,&front,&rear,max_size);
	printf("queue after reversing\n");
	print(q,max_size);
}
