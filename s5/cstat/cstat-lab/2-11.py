import pandas as pd

df = pd.read_csv("credit_card_customers.csv")
print(
    pd.pivot_table(
        df,
        index="Gender",
        columns="Attrition_Flag",
        values="Credit_Limit",
        aggfunc="mean",
    )
)
print(pd.crosstab(df.Gender, df.Attrition_Flag))
