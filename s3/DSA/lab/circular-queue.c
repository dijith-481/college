#include<stdio.h>
#define MAX(a,b) ((a)>(b)?(a):(b))

int enque(int q[],int *front,int *rear,int max_size,int item){
	if ((*rear+1)%max_size  == *front){
		printf("queue is full\n");
		return -1;
	}
	if (*front == -1 ){
		*front =0;
	}
	*rear +=1;
	*rear%=max_size;
	q[*rear]=item;
	return 1;
}

int dequeue(int q[],int *front,int *rear,int max_size){
	if (*front == -1){
		printf("queue is empty\n");
		return -1;
	}
	int item = q[*front];
	if (*front==*rear){
		*front =-1;
		*rear =-1;
	}else{
		*front =(*front+1)%max_size;
	}
	return item;
}

int main(){
	printf("enter the size of queue:");
	int max_size,front=-1,rear=-1;
	scanf("%d",&max_size);
	int q[max_size];
	while (1){
		printf("\n\nselect an option\n1 for enque\n2for dequeue\n3 for printing queue\n4 to quit\n");
		int o;
		scanf("%d",&o);
		switch(o){
			case 1:
				int item;
				printf("enter item to insert:");
				scanf("%d",&item);
				enque(q,&front,&rear,max_size,item);
				break;
			case 2:
				int removed = dequeue(q,&front,&rear,max_size);
				if (removed != -1){
					printf("removed %d",removed);
				}
				break;
			case 3:
				if (front == -1){
					printf("queue is empty\n");
					break;	
				}
				if (rear>front){
					for(int i=front;i<=rear;i++){
						if(q[i]!=-1)
						printf("[%d]:%d\n",i,q[i]);
					}
				}
				else if (rear<front){
					for(int i=front;i<max_size;i++){
						printf("[%d]:%d\n",i,q[i]);
					}
					for(int i=0;i<=rear;i++){
						printf("[%d]:%d\n",i,q[i]);
					}
				}
				break;
			case 4:
				return 0;
		}
	}
}

