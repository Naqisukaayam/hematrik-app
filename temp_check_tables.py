import mysql.connector
import traceback

conn = mysql.connector.connect(host='localhost', user='root', password='', database='hematrik')
cur = conn.cursor()
tables = ['device_state', 'device_events', 'monitoring', 'detections', 'cameras']
for t in tables:
    try:
        cur.execute('SHOW CREATE TABLE ' + t)
        row = cur.fetchone()
        print('---', t, '---')
        print(row[1] if row else 'MISSING')
        print()
    except Exception as e:
        print('---', t, 'ERROR ---', e)
        traceback.print_exc()
        print()
cur.close()
conn.close()
