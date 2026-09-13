def area(l:float,b:float) -> float:
    """
    calculates area of a rectangle.
    """ 
    return l*b

def perimeter(l:float,b:float) -> float:
    """
    calculates area of a rectangle.
    """ 
    return 2*(l+b)

l = float(input("length: "))
b = float(input("breadth: "))
print(f"Rectangle has an area of {area(l,b)} and perimeter {perimeter(l,b)}.")
