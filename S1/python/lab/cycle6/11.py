def get_stick_input(player):
    while True:
        choice = int(input(f"{player}: "))
        if 1 <= choice <= 3:
            return choice
        print("invalid choice try again")


def game(player1, player2):
    sticks = 16
    while True:
        sticks -= get_stick_input(player1)
        if sticks <= 0:
            return player1
        print(f"remaining sticks: {sticks}")
        sticks -= get_stick_input(player2)
        if sticks <= 0:
            return player2
        print(f"remaining sticks: {sticks}")


player1 = input("player1:")
player2 = input("player2:")
loser = game(player1, player2)
print(f"loser: {loser}")
