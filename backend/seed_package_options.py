import requests
from datetime import date, timedelta

API_URL = "http://localhost:8001/api/packages"

# Package IDs (assumed order from creation)
PACKAGE_IDS = {
    "daily": 1,
    "week": 2,
    "4weeks": 3,
    "9weeks": 4,
}

start = date(2025, 6, 1)
num_days = 92  # June, July, August

# 1. Daily options
for i in range(num_days):
    d = start + timedelta(days=i)
    label = d.strftime('%A, %B %d, %Y')
    payload = {
        "label": label,
        "start_date": d.isoformat(),
        "end_date": d.isoformat()
    }
    requests.post(f"{API_URL}/{PACKAGE_IDS['daily']}/options", json=payload)

# 2. Weekly options (Mon-Fri)
for week in range(num_days // 7):
    week_start = start + timedelta(days=week*7)
    week_end = week_start + timedelta(days=4)  # Mon-Fri
    label = f"Week of {week_start.strftime('%B %d, %Y')}"
    payload = {
        "label": label,
        "start_date": week_start.isoformat(),
        "end_date": week_end.isoformat()
    }
    requests.post(f"{API_URL}/{PACKAGE_IDS['week']}/options", json=payload)

# 3. 4-Week options
for block in range(num_days // 28):
    block_start = start + timedelta(days=block*28)
    block_end = block_start + timedelta(days=27)
    label = f"{block_start.strftime('%B %d')} - {block_end.strftime('%B %d, %Y')}"
    payload = {
        "label": label,
        "start_date": block_start.isoformat(),
        "end_date": block_end.isoformat()
    }
    requests.post(f"{API_URL}/{PACKAGE_IDS['4weeks']}/options", json=payload)

# 4. 9-Week option (full summer)
block_start = start
block_end = start + timedelta(days=62)  # 9 weeks = 63 days
label = f"{block_start.strftime('%B %d')} - {block_end.strftime('%B %d, %Y')}"
payload = {
    "label": label,
    "start_date": block_start.isoformat(),
    "end_date": block_end.isoformat()
}
requests.post(f"{API_URL}/{PACKAGE_IDS['9weeks']}/options", json=payload) 