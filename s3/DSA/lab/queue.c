#include<stdio.h>

int enque(int q[],int *front,int *rear,int max_size,int item){
	if (*rear == max_size-1){
		printf("queue is full\n");
		return -1;
	}
	if (*front == -1 && *rear == -1){
		*front =0;
	}
	*rear +=1;
	q[*rear]=item;
	return 1;
}

int dequeue(int q[],int *front,int *rear){
	if (*front == -1){
		printf("queue is empty\n");
		return -1;
	}
	int item = q[*front];
	if (*front==*rear){
		*front =-1;
		*rear =-1;
	}else{
		*front +=1;
	}
	return item;
}

