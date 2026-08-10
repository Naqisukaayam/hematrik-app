"""
HEMATRIX - Generate Sample Data v2.0
======================================
Generate 50 data sample ke database dari foto kampus.
Kombinasi listrik variatif (AC/Lampu/Dispenser bisa beda-beda).

Jalankan: python generate_sample.py
"""

import os
import cv2
import shutil
import random
import math
import mysql.connector
from datetime import datetime, timedelta

# ─────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host"    : "localhost",
    "user"    : "root",
    "password": "",
    "database": "hematrik"
}

SAMPLE_DIR   = "sample_photos"
CAPTURES_DIR = "captures"
MODEL_PATH   = "yolo11n.pt"
CONFIDENCE   = 0.35  # lebih akurat

# Jam untuk tiap kondisi
JAM_NORMAL     = [(8,0),(9,0),(10,0),(10,30),(11,0),
                  (11,30),(13,0),(13,30),(14,0),(14,30),
                  (15,0),(15,30),(8,30),(9,30),(10,15)]
JAM_AMAN       = [(8,0),(9,0),(10,0),(11,0),(13,0),
                  (14,0),(15,0),(8,30),(9,30),(10,30)]
JAM_PEMBOROSAN = [(8,0),(9,0),(10,0),(10,30),(11,0),
                  (11,30),(13,0),(13,30),(14,0),(14,30),
                  (15,0),(15,30),(8,30),(9,30),(10,15)]
JAM_PERINGATAN = [(17,0),(17,30),(18,0),(18,30),(19,0),
                  (19,30),(20,0),(20,30),(21,0),(21,30)]

HARI_INI = datetime.now()

# ─────────────────────────────────────────────────────────────
# KOMBINASI LISTRIK VARIATIF PER KONDISI
# ─────────────────────────────────────────────────────────────
# Format: (ac_on, lampu_on, dispenser_on)
KOMBINASI_NORMAL = [
    (True,  True,  True),   # semua ON
    (True,  True,  True),   # semua ON
    (True,  True,  True),   # semua ON
    (True,  True,  True),   # semua ON
    (True,  True,  True),   # semua ON
    (True,  False, False),  # AC ON, lampu OFF
    (True,  False, False),  # AC ON, lampu OFF
    (True,  False, False),  # AC ON, lampu OFF
    (True,  True,  False),  # AC+Lampu ON, dispenser OFF
    (True,  True,  False),  # AC+Lampu ON, dispenser OFF
    (True,  True,  False),  # AC+Lampu ON, dispenser OFF
    (False, True,  True),   # Lampu+Dispenser ON, AC OFF
    (False, True,  True),   # Lampu+Dispenser ON, AC OFF
    (True,  False, True),   # AC+Dispenser ON, lampu OFF
    (True,  False, True),   # AC+Dispenser ON, lampu OFF
]

KOMBINASI_AMAN = [
    (False, False, False),  # semua OFF
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
    (False, False, False),
]

KOMBINASI_PEMBOROSAN = [
    (True,  True,  True),   # semua ON (pemborosan penuh)
    (True,  True,  True),
    (True,  True,  True),
    (True,  True,  True),
    (True,  True,  True),
    (True,  False, False),  # AC ON saja
    (True,  False, False),
    (True,  False, False),
    (False, True,  True),   # Lampu+Dispenser ON
    (False, True,  True),
    (False, True,  True),
    (True,  True,  False),  # AC+Lampu ON
    (True,  True,  False),
    (True,  False, True),   # AC+Dispenser ON
    (True,  False, True),
]

KOMBINASI_PERINGATAN = [
    (True,  True,  True),   # semua ON malam
    (True,  True,  True),
    (True,  True,  True),
    (True,  False, False),  # AC ON malam
    (True,  False, False),
    (False, True,  True),   # Lampu ON malam
    (False, True,  True),
    (True,  True,  False),  # AC+Lampu ON malam
    (True,  True,  False),
    (True,  False, True),   # AC+Dispenser ON malam
]

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
def get_db():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ DB error: {e}")
        return None

def get_max_log_id():
    conn = get_db()
    if not conn: return 20000
    cur = conn.cursor()
    cur.execute("SELECT MAX(log_id) FROM data_keseluruhan")
    row = cur.fetchone()
    cur.close(); conn.close()
    return (row[0] or 20000) + 1

# ─────────────────────────────────────────────────────────────
# LOAD YOLO
# ─────────────────────────────────────────────────────────────
def load_yolo():
    try:
        from ultralytics import YOLO
        model = YOLO(MODEL_PATH)
        print("✅ Model YOLO loaded")
        return model
    except Exception as e:
        print(f"⚠️  YOLO gagal load: {e}")
        return None

def detect_orang(model, img_path):
    """Deteksi orang di foto, return jumlah orang."""
    if model is None:
        return random.randint(1, 3)
    try:
        results = model(img_path, conf=0.25, verbose=False)
        count = 0
        for r in results:
            if r.boxes:
                for box in r.boxes:
                    if int(box.cls[0]) == 0:
                        x1,y1,x2,y2 = map(int, box.xyxy[0])
                        if (x2-x1) >= 30 and (y2-y1) >= 50:
                            count += 1
        return count
    except:
        return 0
        return 0

# ─────────────────────────────────────────────────────────────
# SIMULASI DATA LISTRIK
# ─────────────────────────────────────────────────────────────
def noise(val, pct=0.05):
    return val * (1 + random.uniform(-pct, pct))

def device_data(power_w, is_on):
    if is_on:
        pw = noise(power_w, 0.05)
        v  = noise(220, 0.02)
        ia = pw / v
        pf = random.uniform(0.85, 0.98)
        ap = pw / pf
        rp = math.sqrt(max(0, ap**2 - pw**2))
        return {
            "power_mw"      : round(pw * 1000, 1),
            "voltage"       : round(v, 1),
            "current_ma"    : round(ia * 1000, 2),
            "apparent_power": round(ap * 1000, 1),
            "reactive_power": round(rp * 1000, 1),
            "factor"        : round(pf, 2),
            "today_kwh"     : round(pw / 1000 * 8, 3),
        }
    else:
        return {
            "power_mw"      : 0.0,
            "voltage"       : round(noise(220, 0.01), 1),
            "current_ma"    : 0.0,
            "apparent_power": 0.0,
            "reactive_power": 0.0,
            "factor"        : 0.0,
            "today_kwh"     : 0.0,
        }

def generate_listrik(ac_on, lmp_on, disp_on):
    return {
        "ac"       : device_data(900, ac_on),
        "lampu"    : device_data(40,  lmp_on),
        "dispenser": device_data(5,   disp_on),
        "ac_on"    : ac_on,
        "lmp_on"   : lmp_on,
        "disp_on"  : disp_on,
    }

# ─────────────────────────────────────────────────────────────
# INSERT DATA KE DB
# ─────────────────────────────────────────────────────────────
def insert_sample(log_id_start, waktu, orang, kondisi, listrik, gambar_filename):
    conn = get_db()
    if not conn: return False, log_id_start
    try:
        cur = conn.cursor()
        ac_str   = "ON" if listrik["ac_on"]   else "OFF"
        lmp_str  = "ON" if listrik["lmp_on"]  else "OFF"
        disp_str = "ON" if listrik["disp_on"] else "OFF"

        cur.execute("""
            INSERT INTO logs
                (waktu, orang, lampu, ac, dispenser, kondisi, gambar,
                 power_ac_w, power_lampu_w)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            str(waktu), orang, lmp_str, ac_str, disp_str, kondisi,
            gambar_filename,
            round(listrik["ac"]["power_mw"] / 1000, 2),
            round(listrik["lampu"]["power_mw"] / 1000, 2),
        ))
        conn.commit()

        waktu_str = waktu.strftime("%d-%b-%y %H:%M:%S").upper()

        for lid, dev_id, dev_key, total_base, yesterday in [
            (log_id_start,   "4B8A13", "ac",        229.574, 128.092),
            (log_id_start+1, "939788", "lampu",     3.148,   0.453),
            (log_id_start+2, "75AA3A", "dispenser", 0.521,   0.089),
        ]:
            d = listrik[dev_key]
            cur.execute("""
                INSERT INTO data_keseluruhan
                    (log_id, device_id, total_kwh, today_kwh, yesterday_kwh,
                     power, apparent_power, reactive_power, factor,
                     voltage, current, time_recorded)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                lid, dev_id,
                round(total_base + random.uniform(0, 5), 3),
                d["today_kwh"], yesterday,
                d["power_mw"], d["apparent_power"], d["reactive_power"],
                d["factor"], d["voltage"], d["current_ma"],
                waktu_str,
            ))

        conn.commit()
        cur.close(); conn.close()
        return True, log_id_start + 3

    except Exception as e:
        print(f"  ❌ Insert error: {e}")
        return False, log_id_start

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  HEMATRIX - Generate Sample Data v2.0")
    print("  Kombinasi listrik variatif per kondisi")
    print("=" * 60)

    conn = get_db()
    if not conn:
        print("❌ Gagal konek DB!"); return
    conn.close()
    print("✅ Database terkoneksi")

    os.makedirs(CAPTURES_DIR, exist_ok=True)
    model  = load_yolo()
    log_id = get_max_log_id()
    print(f"📊 Log ID mulai dari: {log_id}\n")

    kondisi_config = {
        "normal"    : ("NORMAL",     JAM_NORMAL,     KOMBINASI_NORMAL),
        "aman"      : ("AMAN",       JAM_AMAN,       KOMBINASI_AMAN),
        "pemborosan": ("PEMBOROSAN", JAM_PEMBOROSAN, KOMBINASI_PEMBOROSAN),
        "peringatan": ("PERINGATAN", JAM_PERINGATAN, KOMBINASI_PERINGATAN),
    }

    total_berhasil = 0
    total_gagal    = 0

    warna_cv = {
        "NORMAL"    : (0, 255, 0),
        "AMAN"      : (0, 200, 255),
        "PEMBOROSAN": (0, 165, 255),
        "PERINGATAN": (0, 0, 255),
    }

    for folder, (kondisi, jam_list, kombinasi_list) in kondisi_config.items():
        folder_path = os.path.join(SAMPLE_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"⚠️  Folder tidak ditemukan: {folder_path}")
            continue

        foto_list = [
            f for f in os.listdir(folder_path)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        if not foto_list:
            print(f"⚠️  Tidak ada foto di {folder_path}")
            continue

        print(f"\n📁 {folder.upper()} — {len(foto_list)} foto → kondisi: {kondisi}")

        for i, foto_nama in enumerate(foto_list):
            foto_path = os.path.join(folder_path, foto_nama)

            # Deteksi orang
            orang = detect_orang(model, foto_path)
            if kondisi == "NORMAL" and orang == 0:
                orang = random.randint(1, 3)
            elif kondisi in ("AMAN", "PEMBOROSAN", "PERINGATAN"):
                orang = 0

            # Kombinasi listrik variatif
            ac_on, lmp_on, disp_on = kombinasi_list[i % len(kombinasi_list)]

            # Waktu
            hari_mundur = random.randint(0, 14)
            jam, menit  = jam_list[i % len(jam_list)]
            waktu = HARI_INI.replace(
                hour=jam, minute=menit, second=random.randint(0, 59)
            ) - timedelta(days=hari_mundur)

            # Generate listrik
            listrik = generate_listrik(ac_on, lmp_on, disp_on)

            # Simpan foto dengan label
            ts          = int(waktu.timestamp())
            gambar_nama = f"sample_{kondisi.lower()}_{ts}.jpg"
            gambar_dest = os.path.join(CAPTURES_DIR, gambar_nama)

            try:
                img = cv2.imread(foto_path)
                if img is not None:
                    img_r = cv2.resize(img, (640, 480))
                    status_listrik = f"AC:{'ON' if ac_on else 'OFF'} L:{'ON' if lmp_on else 'OFF'} D:{'ON' if disp_on else 'OFF'}"
                    cv2.putText(img_r, f"{kondisi} | Orang:{orang}",
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                                0.8, warna_cv.get(kondisi, (255,255,255)), 2)
                    cv2.putText(img_r, status_listrik,
                                (10, 60), cv2.FONT_HERSHEY_SIMPLEX,
                                0.6, (255, 255, 0), 1)
                    cv2.putText(img_r, waktu.strftime("%d/%m/%Y %H:%M:%S"),
                                (10, 85), cv2.FONT_HERSHEY_SIMPLEX,
                                0.5, (255, 255, 255), 1)
                    cv2.imwrite(gambar_dest, img_r)
                else:
                    shutil.copy2(foto_path, gambar_dest)
            except:
                shutil.copy2(foto_path, gambar_dest)

            # Insert DB
            ok, log_id = insert_sample(log_id, waktu, orang, kondisi, listrik, gambar_nama)

            status = "✅" if ok else "❌"
            print(f"  {status} [{i+1:2d}] {kondisi:10s} | "
                  f"Orang:{orang} | "
                  f"AC:{'ON ' if ac_on else 'OFF'} "
                  f"Lampu:{'ON ' if lmp_on else 'OFF'} "
                  f"Disp:{'ON ' if disp_on else 'OFF'} | "
                  f"{waktu.strftime('%d/%m %H:%M')}")

            if ok: total_berhasil += 1
            else:  total_gagal    += 1

    print(f"\n{'='*60}")
    print(f"  ✅ Berhasil : {total_berhasil} data")
    print(f"  ❌ Gagal    : {total_gagal} data")
    print(f"  📊 Total    : {total_berhasil + total_gagal} data")
    print(f"{'='*60}")
    print("\n🎉 Selesai! Buka web Hematrix untuk lihat hasilnya.")


if __name__ == "__main__":
    main()