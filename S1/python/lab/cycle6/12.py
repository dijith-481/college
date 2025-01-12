import random


def monty_hall(switch):
    doors = [0, 0, 1]
    random.shuffle(doors)
    choice = random.randint(0, 2)
    available_doors = [i for i in range(3) if i != choice and doors[i] == 0]
    host_opens = random.choice(available_doors)
    if switch:
        choice = [i for i in range(3) if i != choice and i != host_opens][0]
    return doors[choice]


n = 10000
switched = 0
switchcount = 0
noswitchcount = 0
for i in range(n):
    switch = bool(random.randint(0, 1))
    switched += switch
    if switch:
        switchcount += monty_hall(switch)
    else:
        noswitchcount += monty_hall(switch)
print(f"switched: {switchcount/switched*100}")
print(f"noswitch: {noswitchcount/(n-switched)*100}")
