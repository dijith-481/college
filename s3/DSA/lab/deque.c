#include<stdio.h>

int insert_rear(int q[],int *front,int *rear,int max_size,int item){
	if (*rear == max_size-1){
		printf("queue_back is full\n");
		return -1;
	}
	if (*front == -1 && *rear == -1){
		*front =0;
	}
	*rear +=1;
	q[*rear]=item;
	return 1;
}

int insert_front(int q[],int *front,int *rear,int max_size,int item){
	if (*front == 0){
		printf("queue_front  is full\n");
		return -1;
	}
	if (*front == -1){
		q[0]=item;
		*front =0;
		*rear=0;
		return 1;
	}
	*front -=1;
	q[*front]=item;
	return 1;
}

int pop_front(int q[],int *front,int *rear){
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

int pop_rear(int q[],int *front,int *rear){
	if (*front ==-1){
		printf("queue is empty\n");
		return -1;
	}
	int item = q[*rear];
	if (*front==*rear){
		*front =-1;
		*rear =-1;
	}else{
		*rear -=1;
	}
	return item;
}

int get_restriction_end(){
	printf("\n1 for  rear restriction\n2 for front restricton\n");
	int res;
	scanf("%d",&res);
	return res;
}

int main(){
	printf("enter the size of queue:");
	int max_size,front=-1,rear=-1;
	scanf("%d",&max_size);
	int q[max_size];
	printf("enter queue type \n1 for input restricted\n2 for output restricted\n");
	int q_type;
	scanf("%d",&q_type);
	int res = get_restriction_end();
	while (1){
		printf("\n\nselect an option\n1 for insert_rear\n2 for insert_front\n3for pop_front\n4for pop_rear\n5 for printing queue\n6 to quit\n");
		int o;
		scanf("%d",&o);
		int item;
		int removed;
		switch(o){
			case 1:
				if (q_type==1&&res==1){
				printf("restricted\n");
					break;
				}
				printf("enter item to insert:");
				scanf("%d",&item);
				insert_rear(q,&front,&rear,max_size,item);
				break;
			case 2:
				if (q_type==1&&res==2){
				printf("restricted\n");
					break;
				}
				int item;
				printf("enter item to insert:");
				scanf("%d",&item);
				insert_front(q,&front,&rear,max_size,item);
				break;
			case 3:
				if (q_type==2&&res==2){
				printf("restricted\n");
					break;
				}
				 removed = pop_front(q,&front,&rear);
				if (removed != -1){
					printf("%d",removed);
				}
				break;
			case 4:
				if (q_type==2&&res==1){
				printf("restricted\n");
					break;
				}
				 removed = pop_rear(q,&front,&rear);
				if (removed != -1){
					printf("%d",removed);
				}
				break;
			case 5:
				if (front == -1){
					printf("queue is empty\n");
					break;	
				}
				for(int i=front;i<=rear;i++){
					printf("[%d]:%d\n",i,q[i]);
				}
				break;
			case 6:
				return 0;
		}
	}
}

