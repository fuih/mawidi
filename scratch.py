import sqlite3
import datetime

conn = sqlite3.connect('apps/backend/clinic.db')
cursor = conn.cursor()

cursor.execute("SELECT d.first_name, w.day_of_week, w.start_time, w.end_time, w.is_active FROM working_hours w JOIN doctors d ON w.doctor_id = d.id")
rows = cursor.fetchall()
print("Working Hours for all doctors:")
for row in rows:
    print(row)

conn.close()
