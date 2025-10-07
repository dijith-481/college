#include <stdio.h>

struct sparse{
	int row;
	int col;
	int val;	
};
typedef struct sparse Sparse;

void display(Sparse m[]){
	printf("row\tcol\tval\n");
	for(int i=0;i<=m[0].val;i++){
		printf("%d\t%d\t%d\n",m[i].row,m[i].col,m[i].val);
	}
}


int main(){
	printf("enter rows cols  of matrix");
	int r,c,v;
	Sparse m[v+1];
	scanf("%d%d",&r,&c);
	m[0].row=r;
	m[0].col=c;
	int mat[r][c];
	int k=1;
	printf("enter elements in  matrix");
	for (int i=0;i<r;i++){
		for (int j=0;j<c;j++){
			scanf("%d",&mat[i][j]);
		}
		
	}
	for (int i=0;i<r;i++){
		for (int j=0;j<c;j++){
			if (mat[i][j]!=0){
				m[k].row= i;
				m[k].col= j;
				m[k].val= mat[i][j];
				k++;
			}
		}
		
	}
	m[0].val=k-1;
	
	printf("matrix\n");
	display(m);
	
}

