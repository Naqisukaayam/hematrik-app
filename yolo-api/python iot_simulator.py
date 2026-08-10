"""
HEMATRIX - IoT Simulator v2.1
==============================
Device:
  4B8A13  → AC           (~900W saat ON)
  939788  → Lampu        (~40W saat ON)
  75AA3A  → Dispenser    (~5W saat ON)

Logika ON/OFF:
  Mode OTOMATIS: jam kerja (08:00–16:00) AND ada orang → ON
  Mode MANUAL  : ikut tombol di dashboard web

Stop: Ctrl+C
"""

import mysql.connector
import time
import random
import math
import requests
from datetime import datetime

# ─────────────────────────────────────────────────────────────
# KONFIGURASI
# ─────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host"    : "localhost",
    "user"    : "root",
    "password": "",
    "database": "hematrik"
}

BACKEND_URL       = "http://127.0.0.1:8000"
INTERVAL_DETIK    = 60
JAM_KERJA_MULAI   = 8
JAM_KERJA_SELESAI = 16

AC_POWER_W        = 900
LAMPU_POWER_W     = 40
DISPENSER_POWER_W = 5

state = {
    "total_kwh_ac"        : 229.574,
    "total_kwh_lampu"     : 3.148,
    "total_kwh_dispenser" : 0.521,
    "log_id"              : 9100,
    "orang_terakhir"      : 0,
}

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
def get_db():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"  ❌ DB error: {e}")
        return None

# ─────────────────────────────────────────────────────────────
# AMBIL STATUS KONTROL DARI BACKEND
# ─────────────────────────────────────────────────────────────
def get_kontrol():
    try:
        resp = requests.get(f"{BACKEND_URL}/kontrol", timeout=3)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {"mode": "otomatis", "ac": None, "lampu": None, "dispenser": None}

# ─────────────────────────────────────────────────────────────
# AMBIL JUMLAH ORANG DARI DB
# ─────────────────────────────────────────────────────────────
def get_orang_dari_db():
    try:
        conn = get_db()
        if not conn:
            return state["orang_terakhir"]
        cur = conn.cursor()
        cur.execute("SELECT orang FROM logs ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        cur.close(); conn.close()
        if row:
            val = int(row[0] or 0)
            state["orang_terakhir"] = val
            return val
    except Exception:
        pass
    return state["orang_terakhir"]

# ─────────────────────────────────────────────────────────────
# LOGIKA ON/OFF
# ─────────────────────────────────────────────────────────────
def is_jam_kerja():
    h = datetime.now().hour
    return JAM_KERJA_MULAI <= h < JAM_KERJA_SELESAI

def tentukan_status():
    kontrol   = get_kontrol()
    mode      = kontrol.get("mode", "otomatis")
    jam_kerja = is_jam_kerja()
    orang     = get_orang_dari_db()
    harus_on  = jam_kerja and (orang > 0)

    if mode == "manual":
        ac_on        = kontrol.get("ac")        if kontrol.get("ac")        is not None else harus_on
        lampu_on     = kontrol.get("lampu")     if kontrol.get("lampu")     is not None else harus_on
        dispenser_on = kontrol.get("dispenser") if kontrol.get("dispenser") is not None else harus_on
    else:
        ac_on = lampu_on = dispenser_on = harus_on

    return ac_on, lampu_on, dispenser_on, jam_kerja, orang, mode

# ─────────────────────────────────────────────────────────────
# SIMULASI SENSOR
# ─────────────────────────────────────────────────────────────
def noise(val, pct=0.03):
    return val * (1 + random.uniform(-pct, pct))

def simulate_device(device_id, power_w, is_on, kwh_key, yesterday_kwh):
    if is_on:
        pw  = noise(power_w, 0.05)
        v   = noise(220, 0.02)
        ia  = pw / v
        pf  = random.uniform(0.85, 0.98)
        ap  = pw / pf
        rp  = math.sqrt(max(0, ap**2 - pw**2))
        ki  = pw / 1000 / 60
    else:
        pw = ia = pf = ap = rp = ki = 0.0
        v  = noise(220, 0.01)

    state[kwh_key] = round(state[kwh_key] + ki, 4)
    waktu = datetime.now().strftime("%d-%b-%y %H:%M:%S").upper()

    return {
        "device_id"     : device_id,
        "power_mw"      : round(pw * 1000, 1),
        "voltage"       : round(v, 1),
        "current_ma"    : round(ia * 1000, 2),
        "total_kwh"     : state[kwh_key],
        "today_kwh"     : round(ki * 1440, 4),
        "yesterday_kwh" : yesterday_kwh,
        "apparent_power": round(ap * 1000, 1) if is_on else 0,
        "reactive_power": round(rp * 1000, 1) if is_on else 0,
        "factor"        : round(pf, 2) if is_on else 0,
        "time_recorded" : waktu,
    }

# ─────────────────────────────────────────────────────────────
# INSERT DB
# ─────────────────────────────────────────────────────────────
def insert_log(ac_on, lampu_on, dispenser_on, orang=0):
    conn = get_db()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO logs
                (waktu, orang, lampu, ac, dispenser, kondisi, gambar,
                 power_ac_w, power_lampu_w, notifikasi, sumber, metode_deteksi,
                 confidence_avg, risk_score, user_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            str(datetime.now()), orang,
            "ON" if lampu_on else "OFF",
            "ON" if ac_on else "OFF",
            "ON" if dispenser_on else "OFF",
            "SIMULATOR", None,
            0, 0, "SIMULATOR", "simulator", "simulator",
            0, 0, None,
        ))
        conn.commit()
        log_id = cur.lastrowid
        cur.close(); conn.close()
        return log_id
    except Exception as e:
        print(f"  ❌ Log insert error: {e}")
        return None


def insert_data(d, log_id):
    if log_id is None:
        return False
    conn = get_db()
    if not conn:
        return False
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO data_keseluruhan
                (log_id, device_id, total_kwh, today_kwh, yesterday_kwh,
                 power, apparent_power, reactive_power, factor,
                 voltage, current, time_recorded)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            log_id, d["device_id"], d["total_kwh"], d["today_kwh"],
            d["yesterday_kwh"], d["power_mw"], d["apparent_power"],
            d["reactive_power"], d["factor"], d["voltage"],
            d["current_ma"], d["time_recorded"],
        ))
        conn.commit(); cur.close(); conn.close()
        return True
    except Exception as e:
        print(f"  ❌ Insert error: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  HEMATRIX IoT Simulator v2.1")
    print("  4B8A13 (AC) | 939788 (Lampu) | 75AA3A (Dispenser)")
    print(f"  Interval: {INTERVAL_DETIK}s | Stop: Ctrl+C")
    print("=" * 55)

    conn = get_db()
    if not conn:
        print("❌ Gagal konek database!"); return
    conn.close()
    print("✅ Database terkoneksi\n")

    while True:
        jam     = datetime.now().strftime("%H:%M:%S")
        tanggal = datetime.now().strftime("%d/%m/%Y")

        ac_on, lampu_on, dispenser_on, jam_kerja, orang, mode = tentukan_status()

        print(f"[{tanggal} {jam}] Mode: {'🤖 OTOMATIS' if mode=='otomatis' else '🕹️  MANUAL'}")
        print(f"  📍 {'Jam Kerja' if jam_kerja else 'Luar Jam'} | 👤 Orang: {orang}")
        print(f"  AC: {'🟢 ON' if ac_on else '🔴 OFF'} | "
              f"Lampu: {'🟢 ON' if lampu_on else '🔴 OFF'} | "
              f"Dispenser: {'🟢 ON' if dispenser_on else '🔴 OFF'}")

        if mode == "manual":
            print("  ℹ️  Dikontrol dari dashboard web")
        elif not jam_kerja:
            print(f"  ℹ️  Luar jam kerja ({JAM_KERJA_MULAI}:00–{JAM_KERJA_SELESAI}:00) → semua OFF")
        elif orang == 0:
            print("  ℹ️  Tidak ada orang → hemat listrik, semua OFF")
        else:
            print(f"  ℹ️  {orang} orang terdeteksi, jam kerja → semua ON")

        log_id = insert_log(ac_on, lampu_on, dispenser_on, orang)
        if log_id is None:
            print("  ❌ Gagal membuat log utama, lewati siklus ini.\n")
            time.sleep(INTERVAL_DETIK - 3)
            continue

        devices = [
            ("4B8A13", AC_POWER_W,        ac_on,        "total_kwh_ac",        128.092, "AC       ", "⚡"),
            ("939788", LAMPU_POWER_W,     lampu_on,     "total_kwh_lampu",     0.453,   "Lampu    ", "💡"),
            ("75AA3A", DISPENSER_POWER_W, dispenser_on, "total_kwh_dispenser", 0.089,   "Dispenser", "🚰"),
        ]

        for device_id, power_w, is_on, kwh_key, yesterday, label, ikon in devices:
            d  = simulate_device(device_id, power_w, is_on, kwh_key, yesterday)
            ok = insert_data(d, log_id)
            print(f"  {ikon} {label} [{device_id}] "
                  f"{round(d['power_mw']/1000,1):5.1f}W "
                  f"{d['voltage']}V → {'✅' if ok else '❌'}")
            time.sleep(1)

        print(f"  📊 log_id: {log_id} | "
              f"kWh AC={state['total_kwh_ac']} "
              f"Lampu={state['total_kwh_lampu']} "
              f"Disp={state['total_kwh_dispenser']}\n")

        time.sleep(INTERVAL_DETIK - 3)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Simulator dihentikan.")