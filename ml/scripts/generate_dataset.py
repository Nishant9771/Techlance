import csv
import random

file = open("../data/fraud_dataset.csv", "w", newline="")
writer = csv.writer(file)

writer.writerow([
    "cancellations",
    "disputes",
    "completion_rate",
    "response_time",
    "message_repeat",
    "fraud"
])

for _ in range(300):
    cancellations = random.randint(0, 6)
    disputes = random.randint(0, 4)
    completion_rate = round(random.uniform(0.1, 1.0), 2)
    response_time = random.randint(1, 24)
    message_repeat = random.randint(0, 1)

    fraud = 1 if (
        cancellations > 3 or
        disputes > 2 or
        completion_rate < 0.4 or
        message_repeat == 1
    ) else 0

    writer.writerow([
        cancellations,
        disputes,
        completion_rate,
        response_time,
        message_repeat,
        fraud
    ])

file.close()
print("Dataset created")