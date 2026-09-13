import math


def calc_rad(cx, cy, px, py):
    r = math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
    return r


cx = float(input("x-coordinate of center: "))
cy = float(input("y-coordinate of center: "))
px = float(input("x-coordinate of point: "))
py = float(input("y-coordinate of point: "))
print("area: ", math.pi * (calc_rad(cx, cy, px, py) ** 2))
