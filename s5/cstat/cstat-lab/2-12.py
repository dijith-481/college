import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

df = pd.read_csv("credit_card_customers.csv")
print(df.head())
print(df.isnull().sum())
df = df.fillna(df.mode().iloc[0])
print(df.Attrition_Flag.value_counts(normalize=True))
df.Attrition_Flag.value_counts().plot(kind="pie", autopct="%1.1f%%")
plt.show()
df.Gender.value_counts().plot(kind="bar")
plt.show()
df.boxplot(column="Credit_Limit", by="Attrition_Flag")
plt.show()
print(df.describe())
sns.heatmap(df.select_dtypes("number").corr(), annot=True)
plt.show()
df = df.drop(columns=["CLIENTNUM"])
print(df.shape)
