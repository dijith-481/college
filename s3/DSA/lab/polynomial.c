#include <stdio.h>

struct term{
	int coeff;
	int exp;
};
typedef struct term Term;

void add_poly(Term p1[],Term p2[],Term pr[],int n1,int n2,int *nr){
	int i=0;
	int j=0;
	int k=0;
	while (i<n1&&j<n2){
		if (p1[i].exp == p2[j].exp){
			pr[k].exp=p1[i].exp;
			pr[k].coeff=p1[i].coeff+p2[j].coeff;
			i++;
			j++;
		}else if (p1[i].exp >p2[j].exp){
			pr[k].exp=p1[i].exp;
			pr[k].coeff=p1[i].coeff;
			i++;
		}else{
			pr[k].exp=p2[j].exp;
			pr[k].coeff=p2[j].coeff;
			j++;
		}
		k++;
	}
	while (i<n1){
		pr[k].exp=p1[i].exp;
		pr[k].coeff=p1[i].coeff;
		i++;
		k++;
	}
	while (j<n2){
		pr[k].exp=p2[j].exp;
		pr[k].coeff=p2[j].coeff;
		j++;
		k++;
	}
	*nr = k;
}

void display(Term p[],int n){
	for (int i=0;i<n-1;i++){
		printf("%dX^%d\t+\t",p[i].coeff,p[i].exp);
	}
	printf("%dX^%d\n",p[n-1].coeff,p[n-1].exp);
}

void input(Term p[],int n){
	for (int i=0;i<n;i++){
		printf("enter coefficent: ");
		scanf("%d",&p[i].coeff);
		printf("enter exponent: ");
		scanf("%d",&p[i].exp);
	}
	
}


int main(){
	int n1,n2;
	printf("enter number of terms in first polynomial: ");
	scanf("%d",&n1);
	printf("enter nummber of  terms in second polynomial: ");
	scanf("%d",&n2);
	Term p1[n1];
	Term p2[n2];
	printf("enter terms in first polynomiali\n");
	input(p1,n1);
	printf("enter terms in second polynomial\n");
	input(p2,n2);
    	int nr=n1+n2;
    	Term pr[nr];
	printf("polynomial 1\n");
	display(p1,n1);
	printf("polynomial 2\n");
	display(p2,n2);
	add_poly(p1,p2,pr,n1,n2,&nr);
	printf("polynomial addition\n");
	display(pr,nr);
}
	


	
