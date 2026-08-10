import mysql.connector
conn = mysql.connector.connect(host="localhost",user="root",password="",database="hematrik")
cur = conn.cursor()
cur.execute("SELECT log_id, device_id, power FROM data_keseluruhan ORDER BY log_id DESC LIMIT 10")
for r in cur.fetchall():
    print(r)
conn.close()