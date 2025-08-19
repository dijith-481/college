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

void transpose(Sparse m[]){
	int row = m[0].row;
	int col = m[0].col;
	int val = m[0].val;
	for (int i=1;i<=val;i++){
		int min = i;
		for (int j=i+1;j<=val;j++){
			if (m[j].col<m[min].col||(m[j].col==m[min].col&& m[j].row<m[min].row)){
				min = j;
			}
		}
		if (min==i){
			int temp = m[i].row;
			m[i].row=m[i].col;
			m[i].col=temp;
			continue;
		}
		int r=m[i].row;
		int c=m[i].col;
		int v=m[i].val;
		m[i].row= m[min].col;
		m[i].col=m[min].row;
		m[i].val=m[min].val;
		m[min].row=r;
		m[min].col=c;
		m[min].val=v;
	}
	m[0].row=col;
	m[0].col=row;
	
}





int main(){
	printf("enter rows cols and value: ");
	int r,c,v;
	scanf("%d%d%d",&r,&c,&v);
	Sparse m[v+1];
	m[0].row=r;
	m[0].col=c;
	m[0].val=v;
	printf("enter rows on matrix: ");
	for (int i=1;i<=v;i++){
		scanf("%d%d%d",&m[i].row,&m[i].col,&m[i].val);
		
	}
	printf("matrix before transpose\n");
	display(m);
	printf("matrix after transpose\n");
	transpose(m);
	display(m);
	
}

