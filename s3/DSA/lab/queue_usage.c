#include<stdio.h>
#include "queue.c"



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
				int removed = dequeue(q,&front,&rear);
				if (removed != -1){
					printf("%d",removed);
				}
				break;
			case 3:
				if (front == -1){
					printf("queue is empty\n");
					break;	
				}
				for(int i=front;i<=rear;i++){
					printf("[%d]:%d\n",i,q[i]);
				}
				break;
			case 4:
				return 0;
		}
	}
}

