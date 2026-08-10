import mysql.connector

conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="hematrik"
)
cur = conn.cursor()

# Hapus dari logs
cur.execute("DELETE FROM logs WHERE gambar LIKE 'sample_%'")
hapus_logs = cur.rowcount

# Hapus dari data_keseluruhan
cur.execute("DELETE FROM data_keseluruhan WHERE log_id >= 12821")
hapus_listrik = cur.rowcount

conn.commit()
cur.close()
conn.close()

print(f"✅ Data sample dihapus!")
print(f"   logs            : {hapus_logs} baris")
print(f"   data_keseluruhan: {hapus_listrik} baris")