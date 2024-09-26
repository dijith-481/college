def simpleInterest(p:float,t:float,r:float) -> float:
    """Calculates the simple interest.
    
    Args:
        p: principal.
        t: time.
        r: rate of interest in % per annum.

    Returns:
        simple interest.
    """
    return (p*t*r)/100

p = float(input("Enter principal amount: "))
t = float(input("Enter time: "))
r = float(input("Enter rate of interest in % per annum: "))
print("simple interest: $",simpleInterest(p,t,r))

