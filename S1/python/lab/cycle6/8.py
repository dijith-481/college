def task_completion(tasks, time):
    tasks.sort()
    count = 0
    for task in tasks:
        if task > time:
            return count
        time -= task
        count += 1


print(task_completion([4, 2, 8, 3, 5], 10))
