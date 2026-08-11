"""
HEMATRIX - main.py (v2.1.0 CCTV Edition)
==========================================
Universitas Mandiri — Smart Energy Monitoring
- Model: yolo11n.pt (pretrained COCO, optimal untuk CCTV)
- Konfigurasi kamera CCTV: sudut lebar, deteksi jarak jauh
- Endpoint lengkap: /check, /status, /history, /summary, /listrik/history
- Auto cek dari frontend setiap 2 menit
- Polling /status tiap 5 detik
- Face detection fallback jika YOLO tidak detect
- process_lock mencegah proses ganda
"""

import sys, cv2, time, os, base64, threading, traceback, csv, io
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.encoders import jsonable_encoder
import mysql.connector
from mysql.connector import Error
from pydantic import BaseModel
from fastapi import Header, HTTPException, Depends
import secrets
from fastapi import Request

# ─────────────────────────────────────────────────────────────
# KONFIGURASI UTAMA
# ─────────────────────────────────────────────────────────────


MODEL_PATH   = "yolo11n.pt"

# Confidence — 0.25 optimal untuk CCTV (tidak terlalu strict)
CONFIDENCE   = 0.50
UPLOAD_CONFIDENCE = 0.18

# Ukuran minimum bounding box orang (piksel)
# Untuk CCTV jarak jauh, orang terlihat lebih kecil → turunkan
MIN_WIDTH    = 45
MIN_HEIGHT   = 80

# Resolusi kamera — tingkatkan untuk CCTV agar detail lebih jelas
CAM_WIDTH    = 1280
CAM_HEIGHT   = 720

# Kamera index — 0 = default laptop/USB pertama
CAM_INDEX    = 0

# Backend kamera — CAP_MSMF untuk Windows laptop
CAM_BACKEND  = cv2.CAP_MSMF

# Folder capture
CAPTURES_DIR = "captures"
CAPTURE_GAP  = 120   # detik minimum antar simpan file

# Threshold IoT
THRESHOLD_AC_MW    = 5_000
THRESHOLD_LAMPU_MW = 200
THRESHOLD_DISPENSER_MW = 50

# Database
DB_CONFIG = {
    "host"    : "localhost",
    "user"    : "root",
    "password": "",
    "database": "hematrik"
}

# ─────────────────────────────────────────────────────────────
# FASTAPI
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="Hematrix API", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
def get_db():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Error as e:
        print(f"⚠️  DB error: {e}")
        return None

def table_has_index(cur, table_name, index_name):
    cur.execute("SHOW INDEX FROM `{}` WHERE Key_name = %s".format(table_name), (index_name,))
    rows = cur.fetchall()
    return len(rows) > 0


def table_has_foreign_key(cur, table_name, constraint_name):
    cur.execute(
        """
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = %s
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
          AND CONSTRAINT_NAME = %s
        """,
        (table_name, constraint_name),
    )
    rows = cur.fetchall()
    return len(rows) > 0


def ensure_column(cur, conn, table_name, column_name, definition):
    try:
        cur.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {definition}")
        conn.commit()
        print(f"✅ Kolom '{column_name}' ditambahkan ke {table_name}")
    except Exception:
        pass


def ensure_index(cur, conn, table_name, index_name, column_def):
    if not table_has_index(cur, table_name, index_name):
        try:
            cur.execute(f"CREATE INDEX {index_name} ON `{table_name}` ({column_def})")
            conn.commit()
            print(f"✅ Index '{index_name}' dibuat pada {table_name}")
        except Exception as e:
            print(f"⚠️  Gagal membuat index {index_name}: {e}")


def ensure_foreign_key(cur, conn, child_table, child_column, parent_table, parent_column, constraint_name, cleanup_sql=None, on_delete="CASCADE"):
    if not table_has_foreign_key(cur, child_table, constraint_name):
        if cleanup_sql:
            try:
                cur.execute(cleanup_sql)
                conn.commit()
                print(f"✅ Cleanup sebelum FK {constraint_name} selesai")
            except Exception as e:
                print(f"⚠️  Cleanup FK {constraint_name} gagal: {e}")
        try:
            cur.execute(
                f"ALTER TABLE `{child_table}` ADD CONSTRAINT {constraint_name} FOREIGN KEY (`{child_column}`) REFERENCES `{parent_table}`(`{parent_column}`) ON DELETE {on_delete} ON UPDATE CASCADE"
            )
            conn.commit()
            print(f"✅ Foreign key '{constraint_name}' ditambahkan ke {child_table}")
        except Exception as e:
            print(f"⚠️  Gagal menambahkan FK {constraint_name} pada {child_table}: {e}")


def ensure_tables():
    """Buat tabel utama jika belum ada, tambah kolom baru jika kurang."""
    conn = get_db()
    if not conn:
        return
    try:
        cur = conn.cursor()

        # Tabel user untuk login dashboard harus dibuat dulu.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                email      VARCHAR(120) NOT NULL UNIQUE,
                password   VARCHAR(255) NOT NULL,
                nama       VARCHAR(120) NOT NULL,
                role       VARCHAR(30) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Buat tabel logs dengan kolom user_id langsung.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                waktu         VARCHAR(50),
                orang         INT DEFAULT 0,
                lampu         VARCHAR(10) DEFAULT 'OFF',
                ac            VARCHAR(10) DEFAULT 'OFF',
                dispenser     VARCHAR(10) DEFAULT 'OFF',
                kondisi       VARCHAR(20),
                gambar        VARCHAR(255),
                power_ac_w    FLOAT DEFAULT 0,
                power_lampu_w FLOAT DEFAULT 0,
                notifikasi    TEXT,
                sumber        VARCHAR(30) DEFAULT 'camera',
                metode_deteksi VARCHAR(30) DEFAULT 'yolo',
                confidence_avg FLOAT DEFAULT 0,
                risk_score    INT DEFAULT 0,
                user_id       INT NULL
            )
        """)

        # Tabel data IoT yang dipakai iot_simulator.py dan endpoint listrik.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS data_keseluruhan (
                id             INT AUTO_INCREMENT PRIMARY KEY,
                log_id         INT NOT NULL,
                device_id      VARCHAR(20) NOT NULL,
                total_kwh      FLOAT DEFAULT 0,
                today_kwh      FLOAT DEFAULT 0,
                yesterday_kwh  FLOAT DEFAULT 0,
                power          FLOAT DEFAULT 0,
                apparent_power FLOAT DEFAULT 0,
                reactive_power FLOAT DEFAULT 0,
                factor         FLOAT DEFAULT 0,
                voltage        FLOAT DEFAULT 0,
                current        FLOAT DEFAULT 0,
                time_recorded  VARCHAR(50),
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_device_log (device_id, log_id)
            )
        """)

        # Tabel koreksi hasil deteksi untuk evaluasi akurasi prototype TA.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS detection_corrections (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                log_id          INT NULL,
                predicted_people INT DEFAULT 0,
                corrected_people INT DEFAULT 0,
                predicted_lampu VARCHAR(10) DEFAULT 'OFF',
                corrected_lampu VARCHAR(10) DEFAULT 'OFF',
                predicted_ac    VARCHAR(10) DEFAULT 'OFF',
                corrected_ac    VARCHAR(10) DEFAULT 'OFF',
                catatan         TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_log_id (log_id)
            )
        """)

        # Status tindak lanjut notifikasi agar peringatan bisa diproses sampai selesai.
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notification_actions (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                log_id     INT NOT NULL UNIQUE,
                status     VARCHAR(30) DEFAULT 'BARU',
                catatan    TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status)
            )
        """)

        # Tambahkan kolom yang mungkin belum ada pada logs.
        for col, defn in [
            ("dispenser",    "VARCHAR(10) DEFAULT 'OFF'"),
            ("power_ac_w",   "FLOAT DEFAULT 0"),
            ("power_lampu_w","FLOAT DEFAULT 0"),
            ("notifikasi",   "TEXT"),
            ("sumber",       "VARCHAR(30) DEFAULT 'camera'"),
            ("metode_deteksi","VARCHAR(30) DEFAULT 'yolo'"),
            ("confidence_avg","FLOAT DEFAULT 0"),
            ("risk_score",   "INT DEFAULT 0"),
            ("user_id",      "INT NULL"),
        ]:
            ensure_column(cur, conn, "logs", col, defn)

        ensure_index(cur, conn, "logs", "idx_user_id", "user_id")
        ensure_index(cur, conn, "data_keseluruhan", "idx_device_log", "device_id, log_id")
        ensure_index(cur, conn, "detection_corrections", "idx_log_id", "log_id")
        ensure_index(cur, conn, "notification_actions", "idx_status", "status")

        ensure_foreign_key(
            cur,
            conn,
            "logs",
            "user_id",
            "users",
            "id",
            "fk_logs_user_id",
            cleanup_sql=None,
            on_delete="SET NULL",
        )

        ensure_foreign_key(
            cur,
            conn,
            "data_keseluruhan",
            "log_id",
            "logs",
            "id",
            "fk_data_keseluruhan_log_id",
            cleanup_sql="""
                DELETE d FROM data_keseluruhan d
                LEFT JOIN logs l ON d.log_id = l.id
                WHERE l.id IS NULL
            """,
            on_delete="CASCADE",
        )

        ensure_foreign_key(
            cur,
            conn,
            "detection_corrections",
            "log_id",
            "logs",
            "id",
            "fk_detection_corrections_log_id",
            cleanup_sql="""
                UPDATE detection_corrections dc
                LEFT JOIN logs l ON dc.log_id = l.id
                SET dc.log_id = NULL
                WHERE dc.log_id IS NOT NULL AND l.id IS NULL
            """,
            on_delete="SET NULL",
        )

        ensure_foreign_key(
            cur,
            conn,
            "notification_actions",
            "log_id",
            "logs",
            "id",
            "fk_notification_actions_log_id",
            cleanup_sql="""
                DELETE na FROM notification_actions na
                LEFT JOIN logs l ON na.log_id = l.id
                WHERE l.id IS NULL
            """,
            on_delete="CASCADE",
        )

        # Admin default hanya dibuat kalau tabel users masih kosong.
        cur.execute("SELECT COUNT(*) FROM users")
        user_count = cur.fetchone()[0]
        if user_count == 0:
            cur.execute(
                """
                INSERT INTO users (email, password, nama, role)
                VALUES (%s, %s, %s, %s)
                """,
                ("admin@hematrix.com", "admin123", "Admin Utama", "admin"),
            )
            print("✅ Admin default dibuat: admin@hematrix.com / admin123")

        conn.commit()
        cur.close()
    except Exception as e:
        print(f"⚠️  ensure_tables: {e}")
    finally:
        conn.close()

ensure_tables()

# ─────────────────────────────────────────────────────────────
# FOLDER CAPTURES
# ─────────────────────────────────────────────────────────────
os.makedirs(CAPTURES_DIR, exist_ok=True)

@app.get("/captures/{filename}")
def get_capture(filename: str):
    path = os.path.join(CAPTURES_DIR, filename)
    if os.path.isfile(path):
        return FileResponse(path, media_type="image/jpeg")
    return JSONResponse({"error": "tidak ditemukan"}, status_code=404)

@app.get("/api/captures/{filename}")
def get_api_capture(filename: str):
    return get_capture(filename)

# ─────────────────────────────────────────────────────────────
# LOAD MODEL YOLO
# ─────────────────────────────────────────────────────────────
model      = None
model_lock = threading.Lock()

def load_yolo():
    global model
    try:
        from ultralytics import YOLO
        m = YOLO(MODEL_PATH)
        with model_lock:
            model = m
        print(f"✅ Model {MODEL_PATH} loaded — siap deteksi CCTV")
    except Exception as e:
        print(f"⚠️  Model gagal load: {e}")

threading.Thread(target=load_yolo, daemon=True).start()

# ─────────────────────────────────────────────────────────────
# HAAR CASCADE (fallback face detection)
# ─────────────────────────────────────────────────────────────
face_cascade = None
if hasattr(cv2, "CascadeClassifier"):
    try:
        cv2_data = getattr(cv2, "data", None)
        if cv2_data and hasattr(cv2_data, "haarcascades"):
            cascade_path = os.path.join(cv2_data.haarcascades, "haarcascade_frontalface_default.xml")
            if os.path.isfile(cascade_path):
                fc = cv2.CascadeClassifier(cascade_path)
                if hasattr(fc, 'empty') and not fc.empty():
                    face_cascade = fc
                    print(f"✅ Haar cascade loaded: {cascade_path}")
                else:
                    print(f"⚠️  Haar cascade tidak dapat dimuat atau kosong: {cascade_path}")
            else:
                print(f"⚠️  Haar cascade file tidak ditemukan: {cascade_path}")
    except Exception as e:
        print(f"⚠️  Gagal memuat Haar cascade: {e}")
else:
    print("⚠️  cv2.CascadeClassifier tidak tersedia, fallback face detection dinonaktifkan.")

# ─────────────────────────────────────────────────────────────
# STATE & LOCK
# ─────────────────────────────────────────────────────────────
LAST_CAPTURE = 0
process_lock = threading.Lock()

# ─────────────────────────────────────────────────────────────
# UTILITY
# ─────────────────────────────────────────────────────────────
def is_work():
    h = datetime.now().hour
    m = datetime.now().minute
    return (h > 8 or (h == 8)) and (h < 16 or (h == 16 and m <= 30))

def enhance_frame(frame):
    """Perbaiki pencahayaan untuk kondisi CCTV yang sering gelap."""
    return cv2.convertScaleAbs(frame, alpha=1.3, beta=30)

def draw_boxes(frame, persons, faces_fallback=False):
    """Gambar bounding box di frame untuk visualisasi."""
    result = frame.copy()
    color = (0, 255, 0) if not faces_fallback else (255, 165, 0)
    label = "Person" if not faces_fallback else "Face"
    for p in persons:
        x1, y1, x2, y2 = p["x1"], p["y1"], p["x2"], p["y2"]
        cv2.rectangle(result, (x1, y1), (x2, y2), color, 2)
        cv2.putText(result, f"{label} {p.get('conf','')}", (x1, y1-8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    # Tambah info jumlah orang
    cv2.putText(result, f"Orang: {len(persons)}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.putText(result, datetime.now().strftime("%d/%m/%Y %H:%M:%S"), (10, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    return result

def is_valid_realtime_person_box(frame_shape, x1, y1, x2, y2, conf):
    """Filter realtime agar benda besar/miring tidak mudah dihitung sebagai orang."""
    frame_h, frame_w = frame_shape[:2]
    w_box = max(1, x2 - x1)
    h_box = max(1, y2 - y1)
    area_ratio = (w_box * h_box) / float(max(1, frame_w * frame_h))
    aspect = h_box / float(w_box)

    if w_box < MIN_WIDTH or h_box < MIN_HEIGHT:
        return False

    # Orang yang duduk/miring bisa lebih melebar, jadi jangan terlalu kaku.
    # Confidence rendah tetap boleh, tetapi bentuk dan luasnya harus lebih masuk akal.
    if conf >= 0.55:
        if aspect < 0.55 or aspect > 5.2:
            return False
        if area_ratio > 0.62 and conf < 0.72:
            return False
        return True

    if conf < 0.30:
        return False
    if aspect < 0.75 or aspect > 4.4:
        return False
    if area_ratio > 0.42:
        return False
    return True

# ─────────────────────────────────────────────────────────────
# DETEKSI ORANG — YOLO + fallback face detection
# ─────────────────────────────────────────────────────────────
def detect_people(frame):
    """
    Deteksi orang dengan YOLOv11n.
    Jika tidak terdeteksi, fallback ke Haar Cascade face detection.
    Return: (jumlah_orang, list_boxes, frame_dengan_box, pakai_fallback)
    """
    persons      = []
    use_fallback = False

    # ── YOLO Detection ──
    with model_lock:
        m = model

    if m:
        frame_enh = enhance_frame(frame)

        # Upscale frame untuk deteksi orang yang terlihat kecil (khas CCTV)
        h, w = frame_enh.shape[:2]
        if w < 1280:
            scale      = 1280 / w
            frame_up   = cv2.resize(frame_enh, (1280, int(h * scale)))
        else:
            scale      = 1.0
            frame_up   = frame_enh

        results = m(frame_up, conf=CONFIDENCE, verbose=False, imgsz=640)

        for r in results:
            boxes = r.boxes
            if boxes is None or len(boxes) == 0:
                continue
            for box in boxes:
                cls  = int(box.cls[0])
                conf = float(box.conf[0])
                if cls != 0:   # hanya class person
                    continue
                x1, y1, x2, y2 = map(float, box.xyxy[0])
                x1 = int(x1 / scale)
                y1 = int(y1 / scale)
                x2 = int(x2 / scale)
                y2 = int(y2 / scale)
                x1 = max(0, min(frame.shape[1] - 1, x1))
                x2 = max(0, min(frame.shape[1] - 1, x2))
                y1 = max(0, min(frame.shape[0] - 1, y1))
                y2 = max(0, min(frame.shape[0] - 1, y2))
                if not is_valid_realtime_person_box(frame.shape, x1, y1, x2, y2, conf):
                    continue
                persons.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "conf": round(conf, 2)
                })

    if len(persons) == 0 and face_cascade is not None:
        use_fallback = True
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
        )
        for (x, y, w, h) in faces:
            area_ratio = (w * h) / float(max(1, frame.shape[0] * frame.shape[1]))
            if area_ratio > 0.12:
                continue
            persons.append({
                "x1": x, "y1": y,
                "x2": x + w, "y2": y + h,
                "conf": "face"
            })
        if len(faces) > 0:
            print(f"🔄 Fallback face detection: {len(faces)} wajah")

    # Gambar bounding box
    frame_out = draw_boxes(frame, persons, use_fallback)

    return len(persons), persons, frame_out, use_fallback

def _iou(a, b):
    x1 = max(a["x1"], b["x1"])
    y1 = max(a["y1"], b["y1"])
    x2 = min(a["x2"], b["x2"])
    y2 = min(a["y2"], b["y2"])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = max(1, (a["x2"] - a["x1"]) * (a["y2"] - a["y1"]))
    area_b = max(1, (b["x2"] - b["x1"]) * (b["y2"] - b["y1"]))
    return inter / float(area_a + area_b - inter + 1e-6)

def _dedupe_boxes(boxes, threshold=0.45):
    result = []
    for box in sorted(boxes, key=lambda b: float(b.get("conf", 0) or 0), reverse=True):
        if all(_iou(box, kept) < threshold for kept in result):
            result.append(box)
    return result

def crop_dark_borders(frame):
    """Buang border hitam dari gambar upload agar YOLO fokus ke area ruangan."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    rows = np.where(gray.mean(axis=1) > 8)[0]
    cols = np.where(gray.mean(axis=0) > 8)[0]
    if len(rows) < 20 or len(cols) < 20:
        return frame, 0, 0
    y1, y2 = int(rows[0]), int(rows[-1] + 1)
    x1, x2 = int(cols[0]), int(cols[-1] + 1)
    crop = frame[y1:y2, x1:x2]
    if crop.size == 0:
        return frame, 0, 0
    return crop, x1, y1

def detect_people_upload(frame, conf_override=None, min_width_override=None, min_height_override=None):
    """Mode deteksi lebih sensitif untuk gambar upload/demo dari sudut CCTV."""
    persons = []
    use_fallback = False
    crop, off_x, off_y = crop_dark_borders(frame)

    with model_lock:
        m = model

    confs = [float(conf_override)] if conf_override else [0.18, 0.12, 0.08]
    min_w = int(min_width_override or 8)
    min_h = int(min_height_override or 14)

    if m:
        source = enhance_frame(crop)
        h, w = source.shape[:2]
        target_w = 1600 if w < 1600 else w
        scale = target_w / w
        frame_up = cv2.resize(source, (target_w, int(h * scale))) if scale != 1 else source

        for conf in confs:
            try:
                results = m(frame_up, conf=conf, verbose=False, imgsz=960)
            except Exception:
                results = []

            found = []
            for r in results:
                boxes = r.boxes
                if boxes is None or len(boxes) == 0:
                    continue
                for box in boxes:
                    cls = int(box.cls[0])
                    score = float(box.conf[0])
                    if cls != 0:
                        continue
                    x1, y1, x2, y2 = map(float, box.xyxy[0])
                    x1 = int(x1 / scale) + off_x
                    y1 = int(y1 / scale) + off_y
                    x2 = int(x2 / scale) + off_x
                    y2 = int(y2 / scale) + off_y
                    x1 = max(0, min(frame.shape[1] - 1, x1))
                    x2 = max(0, min(frame.shape[1] - 1, x2))
                    y1 = max(0, min(frame.shape[0] - 1, y1))
                    y2 = max(0, min(frame.shape[0] - 1, y2))
                    if (x2 - x1) < min_w or (y2 - y1) < min_h:
                        continue
                    found.append({
                        "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                        "conf": round(score, 2)
                    })

            persons = _dedupe_boxes(found)
            if persons:
                break

    if len(persons) == 0 and face_cascade is not None:
        use_fallback = True
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.05, minNeighbors=3, minSize=(14, 14)
        )
        for (x, y, w, h) in faces:
            persons.append({
                "x1": int(x + off_x), "y1": int(y + off_y),
                "x2": int(x + w + off_x), "y2": int(y + h + off_y),
                "conf": "face"
            })

    frame_out = draw_boxes(frame, persons, use_fallback)
    return len(persons), persons, frame_out, use_fallback

def apply_demo_overrides(listrik, lampu_visual="auto", ac_visual="auto"):
    """Untuk demo upload foto: izinkan status perangkat mengikuti kondisi visual."""
    lampu_value = str(lampu_visual or "auto").lower()
    ac_value = str(ac_visual or "auto").lower()
    if lampu_value in ("1", "true", "on", "yes", "aktif"):
        listrik["lampu"] = "ON"
        listrik["listrik_aktif"] = True
        if float(listrik.get("power_lampu_w", 0) or 0) <= 0:
            listrik["power_lampu_w"] = 18.0
            listrik["power_lampu_mw"] = 18000.0
    if ac_value in ("1", "true", "on", "yes", "aktif"):
        listrik["ac"] = "ON"
        listrik["listrik_aktif"] = True
        if float(listrik.get("power_ac_w", 0) or 0) <= 0:
            listrik["power_ac_w"] = 450.0
            listrik["power_ac_mw"] = 450000.0
    return listrik

def current_camera_config():
    """Ambil konfigurasi kamera dari settings_state jika sudah tersedia."""
    state = globals().get("settings_state", {})
    source = str(state.get("cameraSource", "webcam")).lower()
    backend_name = str(state.get("cameraBackend", "MSMF")).upper()
    backend = cv2.CAP_DSHOW if backend_name == "DSHOW" else cv2.CAP_MSMF

    if source in ("rtsp", "ip", "cctv"):
        url = str(state.get("cameraUrl", "")).strip()
        return {
            "source": "rtsp",
            "target": url or CAM_INDEX,
            "backend": None,
            "label": url or "RTSP URL belum diisi",
        }

    try:
        index = int(state.get("cameraIndex", CAM_INDEX))
    except Exception:
        index = CAM_INDEX
    return {
        "source": "webcam",
        "target": index,
        "backend": backend,
        "label": f"Webcam index {index} ({backend_name})",
    }

def open_configured_camera():
    cfg = current_camera_config()
    if cfg["source"] == "rtsp":
        return cv2.VideoCapture(cfg["target"]), cfg
    return cv2.VideoCapture(cfg["target"], cfg["backend"]), cfg

# ─────────────────────────────────────────────────────────────
# AMBIL DATA LISTRIK IoT
# ─────────────────────────────────────────────────────────────
# ── GANTI seluruh fungsi get_listrik() di main.py dengan ini ──

def apply_manual_kontrol(result):
    try:
        manual = globals().get("kontrol_state", {})
        if manual.get("mode") != "manual":
            return result

        demo_power = {"ac": 928.0, "lampu": 40.0, "dispenser": 350.0}
        for dev in ("ac", "lampu", "dispenser"):
            value = manual.get(dev)
            if value is None:
                continue
            result[dev] = "ON" if value else "OFF"
            if dev == "ac":
                result["power_ac_w"] = demo_power["ac"] if value else 0.0
                result["power_ac_mw"] = result["power_ac_w"] * 1000
                result["voltage_ac"] = result["voltage_ac"] or 220.0
                result["current_ac"] = round(result["power_ac_w"] / max(result["voltage_ac"], 1), 2)
            elif dev == "lampu":
                result["power_lampu_w"] = demo_power["lampu"] if value else 0.0
                result["power_lampu_mw"] = result["power_lampu_w"] * 1000
                result["voltage_lampu"] = result["voltage_lampu"] or 220.0
                result["current_lampu"] = round(result["power_lampu_w"] / max(result["voltage_lampu"], 1), 2)

        result["listrik_aktif"] = any(result.get(dev) == "ON" for dev in ("ac", "lampu", "dispenser"))
    except Exception as e:
        print(f"Kontrol manual gagal diterapkan: {e}")
    return result

def get_listrik():
    result = {
        "ac": "OFF", "lampu": "OFF", "dispenser": "OFF", "listrik_aktif": False,
        "power_ac_mw": 0.0,   "power_ac_w": 0.0,
        "power_lampu_mw": 0.0,"power_lampu_w": 0.0,
        "voltage_ac": 0.0,    "voltage_lampu": 0.0,
        "current_ac": 0.0,    "current_lampu": 0.0,
        "today_kwh_ac": 0.0,  "today_kwh_lampu": 0.0,
        "time_ac": None,      "time_lampu": None,
    }
    try:
        conn = get_db()
        if not conn:
            return apply_manual_kontrol(result)
        cur = conn.cursor()

        # Ambil data terbaru untuk 3 device sekaligus
        cur.execute("""
            SELECT d.device_id, d.power, d.voltage, d.current,
                   d.today_kwh, d.time_recorded
            FROM data_keseluruhan d
            INNER JOIN (
                SELECT device_id, MAX(log_id) AS mid
                FROM data_keseluruhan
                WHERE device_id IN ('4B8A13', '75AA3A', '939788')
                GROUP BY device_id
            ) l ON d.device_id = l.device_id AND d.log_id = l.mid
        """)

        for row in cur.fetchall():
            dev, pmw, volt, curr, kwh, trec = row
            pmw = float(pmw or 0)
            pw  = round(pmw / 1000, 2)

            if dev == "4B8A13":
                # AC
                result.update({
                    "power_ac_mw": pmw, "power_ac_w": pw,
                    "voltage_ac": float(volt or 0),
                    "current_ac": round(float(curr or 0) / 1000, 2),
                    "today_kwh_ac": float(kwh or 0),
                    "time_ac": str(trec) if trec else None,
                })
                if pmw > THRESHOLD_AC_MW:
                    result["ac"] = "ON"
                    result["listrik_aktif"] = True

            elif dev == "939788":
                # LAMPU (device baru)
                result.update({
                    "power_lampu_mw": pmw, "power_lampu_w": pw,
                    "voltage_lampu": float(volt or 0),
                    "current_lampu": round(float(curr or 0) / 1000, 2),
                    "today_kwh_lampu": float(kwh or 0),
                    "time_lampu": str(trec) if trec else None,
                })
                if pmw > THRESHOLD_LAMPU_MW:
                    result["lampu"] = "ON"
                    result["listrik_aktif"] = True

            elif dev == "75AA3A":
                # DISPENSER
                if pmw > THRESHOLD_DISPENSER_MW:
                    result["dispenser"] = "ON"
                    result["listrik_aktif"] = True

        cur.close()
        conn.close()
    except Exception as e:
        print(f"⚠️  get_listrik: {e}")
    return result
# ─────────────────────────────────────────────────────────────
# LOGIC KONDISI
# ─────────────────────────────────────────────────────────────
def build_waste_analysis(people_count, listrik):
    """Analisis potensi pemborosan energi untuk prototype Tugas Akhir."""
    jam = is_work()
    listrik_aktif = bool(listrik.get("listrik_aktif"))
    active_devices = [
        name for name in ("ac", "lampu", "dispenser")
        if listrik.get(name) == "ON"
    ]
    total_power_w = round(
        float(listrik.get("power_ac_w", 0) or 0)
        + float(listrik.get("power_lampu_w", 0) or 0),
        2,
    )

    if jam and people_count > 0 and listrik_aktif:
        kondisi = "NORMAL"
        notif = f"Kondisi normal: {people_count} orang terdeteksi dan perangkat aktif sesuai kebutuhan."
        risk_score = 15
        risk_level = "RENDAH"
        rekomendasi = "Pertahankan pemantauan otomatis."
    elif jam and people_count == 0 and listrik_aktif:
        kondisi = "PEMBOROSAN"
        notif = "Pemborosan terdeteksi: ruangan kosong tetapi perangkat listrik masih menyala."
        risk_score = 90
        risk_level = "TINGGI"
        rekomendasi = "Matikan perangkat atau aktifkan mode otomatis agar sistem memutus perangkat saat ruangan kosong."
    elif jam and people_count > 0 and not listrik_aktif:
        kondisi = "NORMAL"
        notif = f"Ada {people_count} orang di ruangan, tetapi perangkat listrik mati."
        risk_score = 20
        risk_level = "RENDAH"
        rekomendasi = "Nyalakan perangkat hanya jika diperlukan."
    elif not jam and listrik_aktif:
        kondisi = "PERINGATAN"
        notif = "Peringatan: perangkat listrik aktif di luar jam kerja."
        risk_score = 80
        risk_level = "TINGGI"
        rekomendasi = "Periksa ruangan dan matikan perangkat setelah jam kerja."
    else:
        kondisi = "AMAN"
        notif = "Aman: tidak ada indikasi pemborosan energi."
        risk_score = 5
        risk_level = "RENDAH"
        rekomendasi = "Tidak ada tindakan khusus."

    return {
        "kondisi": kondisi,
        "notifikasi": notif,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "rekomendasi": rekomendasi,
        "jam_kerja": jam,
        "listrik_aktif": listrik_aktif,
        "perangkat_aktif": active_devices,
        "total_power_w": total_power_w,
    }

def process_logic(people_count, listrik_aktif):
    jam = is_work()
    if jam:
        if people_count > 0 and listrik_aktif:
            return "NORMAL",    f"✅ Kondisi normal — {people_count} orang terdeteksi, listrik aktif"
        elif people_count == 0 and listrik_aktif:
            return "PEMBOROSAN","⚠️ Pemborosan: ruangan kosong tapi listrik menyala"
        elif people_count > 0 and not listrik_aktif:
            return "NORMAL",    f"✅ Ada {people_count} orang, perangkat listrik mati"
        else:
            return "AMAN",      "✅ Aman: ruangan kosong dan listrik mati"
    else:
        if listrik_aktif:
            return "PERINGATAN","🚨 Listrik menyala di luar jam kerja"
        else:
            return "AMAN",      "✅ Aman: di luar jam kerja dan listrik mati"

# ─────────────────────────────────────────────────────────────
def confidence_average(persons):
    numeric = [
        float(p.get("conf", 0))
        for p in persons
        if isinstance(p.get("conf"), (int, float))
    ]
    return round(sum(numeric) / len(numeric), 3) if numeric else 0.0

def encode_frame_b64(frame):
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not ok:
        return None
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode()

def save_detection_log(waktu_cek, person, listrik, analysis, filename, source, method, conf_avg, user_id=None):
    try:
        conn = get_db()
        if not conn:
            return None
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO logs
                (waktu,orang,lampu,ac,dispenser,kondisi,gambar,power_ac_w,power_lampu_w,
                 notifikasi,sumber,metode_deteksi,confidence_avg,risk_score,user_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            str(waktu_cek), person,
            listrik.get("lampu", "OFF"), listrik.get("ac", "OFF"), listrik.get("dispenser", "OFF"),
            analysis["kondisi"], filename,
            listrik.get("power_ac_w", 0), listrik.get("power_lampu_w", 0),
            analysis["notifikasi"], source, method, conf_avg, analysis["risk_score"],
            user_id,
        ))
        conn.commit()
        log_id = cur.lastrowid
        cur.close(); conn.close()
        return log_id
    except Exception as e:
        print(f"DB save detection log: {e}")
        return None

def build_detection_response(person, persons, frame_out, listrik, source, filename=None, fallback=False, save_log=True, user_id=None):
    waktu_cek = datetime.now()
    analysis = build_waste_analysis(person, listrik)
    method = "face_fallback" if fallback else "yolo"
    conf_avg = confidence_average(persons)
    img_b64 = encode_frame_b64(frame_out) if frame_out is not None else None

    if filename is None and frame_out is not None:
        filename = f"{source}_{int(time.time())}.jpg"
        cv2.imwrite(os.path.join(CAPTURES_DIR, filename), frame_out)

    log_id = save_detection_log(
        waktu_cek, person, listrik, analysis, filename,
        source, method, conf_avg, user_id=user_id
    ) if save_log else None

    return {
        "success": True,
        "orang": person,
        "boxes": persons,
        "ac": listrik.get("ac", "OFF"),
        "lampu": listrik.get("lampu", "OFF"),
        "dispenser": listrik.get("dispenser", "OFF"),
        "kondisi": analysis["kondisi"],
        "notifikasi": analysis["notifikasi"],
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"],
        "rekomendasi": analysis["rekomendasi"],
        "perangkat_aktif": analysis["perangkat_aktif"],
        "total_power_w": analysis["total_power_w"],
        "jam_kerja": analysis["jam_kerja"],
        "waktu": str(waktu_cek),
        "log_id": log_id,
        "sumber": source,
        "metode_deteksi": method,
        "confidence_avg": conf_avg,
        "gambar": filename,
        "gambar_b64": img_b64,
        "gambar_url": f"/api/captures/{filename}" if filename else None,
        "power_ac_w": listrik.get("power_ac_w", 0),
        "power_lampu_w": listrik.get("power_lampu_w", 0),
        "power_ac_mw": listrik.get("power_ac_mw", 0),
        "power_lampu_mw": listrik.get("power_lampu_mw", 0),
        "voltage_ac": listrik.get("voltage_ac", 0),
        "voltage_lampu": listrik.get("voltage_lampu", 0),
        "current_ac": listrik.get("current_ac", 0),
        "current_lampu": listrik.get("current_lampu", 0),
        "today_kwh_ac": listrik.get("today_kwh_ac", 0),
        "today_kwh_lampu": listrik.get("today_kwh_lampu", 0),
        "time_ac": listrik.get("time_ac"),
        "time_lampu": listrik.get("time_lampu"),
        "is_work": is_work(),
        "busy": False,
    }

# PROSES UTAMA
# ─────────────────────────────────────────────────────────────
def process(user_id=None):
    global LAST_CAPTURE

    if not process_lock.acquire(blocking=False):
        print("⏳ Proses sedang berjalan, skip.")
        return {"error": "Sedang memproses", "busy": True}

    try:
        waktu_cek = datetime.now()
        print(f"\n{'='*50}")
        print(f"🔍 Deteksi: {waktu_cek.strftime('%d/%m/%Y %H:%M:%S')}")

        # 1. Data listrik IoT
        listrik       = apply_manual_kontrol(get_listrik())
        ac            = listrik["ac"]
        lampu         = listrik["lampu"]
        dispenser     = listrik["dispenser"]
        listrik_aktif = listrik["listrik_aktif"]
        print(f"⚡ Listrik — AC:{ac} Lampu:{lampu} ({listrik['power_ac_w']}W)")

        # 2. Kamera
        person   = 0
        img_b64  = None
        filename = None
        camera_status = "not_checked"
        camera_message = "Kamera belum dicek."

        try:
            cap, cam_cfg = open_configured_camera()
            camera_message = f"Mencoba kamera {cam_cfg.get('label', cam_cfg.get('target', 'default'))}."

            # Set resolusi tinggi untuk CCTV
            cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAM_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAM_HEIGHT)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            if cap.isOpened():
                # Warm up kamera — flush buffer
                for _ in range(10):
                    cap.read()
                time.sleep(0.5)

                ret, frame = cap.read()
                cap.release()

                if ret and frame is not None:
                    camera_status = "ok"
                    camera_message = "Kamera aktif dan gambar berhasil dianalisis."
                    print(f"📷 Frame: {frame.shape[1]}x{frame.shape[0]}")

                    # Deteksi orang
                    person, persons, frame_out, fallback = detect_people(frame)
                    print(f"👤 Orang terdeteksi: {person} {'(fallback)' if fallback else '(YOLO)'}")

                    # Encode gambar dengan bounding box
                    ok, buf = cv2.imencode(".jpg", frame_out, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    if ok:
                        img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode()

                    # Simpan file (anti-spam)
                    now = time.time()
                    if now - LAST_CAPTURE >= CAPTURE_GAP:
                        filename     = f"{int(now)}.jpg"
                        cv2.imwrite(os.path.join(CAPTURES_DIR, filename), frame_out)
                        LAST_CAPTURE = now
                        print(f"📸 Capture: {filename}")
                else:
                    camera_status = "frame_failed"
                    camera_message = "Kamera terbuka, tetapi frame/gambar gagal diambil."
                    print("⚠️  Frame gagal diambil")
            else:
                camera_status = "not_open"
                camera_message = "Kamera tidak bisa dibuka. Periksa pengaturan sumber kamera, index webcam, atau izin kamera Windows."
                print("⚠️  Kamera tidak terbuka")
                cap.release()

        except Exception as e:
            camera_status = "error"
            camera_message = f"Kamera error: {e}"
            print(f"⚠️  Kamera error: {e}")
            traceback.print_exc()

        # 3. Kondisi dan analisis pemborosan
        analysis = build_waste_analysis(person, listrik)
        kondisi = analysis["kondisi"]
        notif = analysis["notifikasi"]
        method = "face_fallback" if "fallback" in locals() and fallback else "yolo"
        conf_avg = confidence_average(persons) if "persons" in locals() else 0.0
        print(f"📊 Kondisi: {kondisi}")

        # 4. Simpan ke DB
        log_id = None
        try:
            conn = get_db()
            if conn:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO logs
                        (waktu,orang,lampu,ac,dispenser,kondisi,gambar,power_ac_w,power_lampu_w,
                         notifikasi,sumber,metode_deteksi,confidence_avg,risk_score,user_id)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (str(waktu_cek), person, lampu, ac, dispenser, kondisi,
                      filename, listrik["power_ac_w"], listrik["power_lampu_w"],
                      notif, "camera", method, conf_avg, analysis["risk_score"], user_id))
                conn.commit()
                log_id = cur.lastrowid
                cur.close(); conn.close()
                print(f"✅ Log #{log_id} tersimpan")
        except Exception as e:
            print(f"⚠️  DB save: {e}")

        print(f"{'='*50}")

        return {
            "orang"          : person,
            "ac"             : ac,
            "lampu"          : lampu,
            "dispenser"      : dispenser,
            "kondisi"        : kondisi,
            "notifikasi"     : notif,
            "risk_score"     : analysis["risk_score"],
            "risk_level"     : analysis["risk_level"],
            "rekomendasi"    : analysis["rekomendasi"],
            "perangkat_aktif": analysis["perangkat_aktif"],
            "total_power_w"  : analysis["total_power_w"],
            "metode_deteksi" : method,
            "confidence_avg" : conf_avg,
            "boxes"          : persons if "persons" in locals() else [],
            "waktu"          : str(waktu_cek),
            "log_id"         : log_id,
            "gambar"         : filename,
            "gambar_b64"     : img_b64,
            "gambar_url"     : f"/api/captures/{filename}" if filename else None,
            "power_ac_w"     : listrik["power_ac_w"],
            "power_lampu_w"  : listrik["power_lampu_w"],
            "power_ac_mw"    : listrik["power_ac_mw"],
            "power_lampu_mw" : listrik["power_lampu_mw"],
            "voltage_ac"     : listrik["voltage_ac"],
            "voltage_lampu"  : listrik["voltage_lampu"],
            "current_ac"     : listrik["current_ac"],
            "current_lampu"  : listrik["current_lampu"],
            "today_kwh_ac"   : listrik["today_kwh_ac"],
            "today_kwh_lampu": listrik["today_kwh_lampu"],
            "time_ac"        : listrik["time_ac"],
            "time_lampu"     : listrik["time_lampu"],
            "is_work"        : is_work(),
            "busy"           : False,
            "camera_status"  : camera_status,
            "camera_message" : camera_message,
        }

    finally:
        process_lock.release()

# ═════════════════════════════════════════════════════════════
# ENDPOINTS
# ═════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "msg"    : "Hematrix API v2.1.0 CCTV Edition",
        "model"  : MODEL_PATH,
        "waktu"  : str(datetime.now()),
        "status" : "online",
    }

@app.get("/check")
def check(request: Request):
    """Deteksi penuh: kamera CCTV + YOLO + listrik IoT + simpan DB."""
    try:
        session = get_session_from_request(request)
        user_id = int(session.get("id")) if session and session.get("id") else None
        result = process(user_id=user_id)
        return JSONResponse(content=jsonable_encoder(result))
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/check/sample-mandiri")
def check_sample_mandiri():
    """Demo mobile: gunakan foto ruang Universitas Mandiri Subang sebagai sumber deteksi."""
    try:
        sample_path = os.path.join(
            "sample_photos",
            "pemborosan",
            "WhatsApp Image 2026-05-24 at 12.58.25 - Copy.jpeg",
        )
        if not os.path.isfile(sample_path):
            return JSONResponse(
                {"success": False, "message": f"Foto demo tidak ditemukan: {sample_path}"},
                status_code=404,
            )

        frame = cv2.imread(sample_path)
        if frame is None:
            return JSONResponse(
                {"success": False, "message": "Foto demo tidak bisa dibaca."},
                status_code=400,
            )

        listrik = apply_manual_kontrol(get_listrik())
        detected_person, persons, frame_out, fallback = detect_people_upload(
            frame,
            conf_override=0.12,
            min_width_override=12,
            min_height_override=18,
        )

        response = build_detection_response(
            detected_person,
            persons,
            frame_out,
            listrik,
            source="sample_mandiri",
            fallback=fallback,
            save_log=True,
            user_id=None,
        )
        response["success"] = True
        response["demo_mode"] = True
        response["demo_title"] = "Ruang Universitas Mandiri Subang"
        response["camera_status"] = "demo"
        response["camera_message"] = "Mode demo mobile memakai foto ruang Universitas Mandiri Subang dari folder sample_photos."
        response["detected_orang"] = detected_person
        return response
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.post("/detect/upload")
async def detect_upload(
    file: UploadFile = File(...),
    lampu_visual: str = Form("auto"),
    ac_visual: str = Form("auto"),
    manual_people: str = Form(""),
    confidence: str = Form(""),
    min_width: str = Form(""),
    min_height: str = Form(""),
):
    """Deteksi orang dari gambar upload untuk demo/prototype tanpa kamera."""
    try:
        if not file.content_type or not file.content_type.startswith("image/"):
            return JSONResponse(
                {"success": False, "message": "File harus berupa gambar JPG/PNG."},
                status_code=400,
            )

        raw = await file.read()
        if len(raw) > 8 * 1024 * 1024:
            return JSONResponse(
                {"success": False, "message": "Ukuran gambar maksimal 8 MB."},
                status_code=400,
            )

        arr = np.frombuffer(raw, np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            return JSONResponse(
                {"success": False, "message": "Gambar tidak bisa dibaca."},
                status_code=400,
            )

        conf_value = float(confidence) if str(confidence).strip() else None
        min_w_value = int(min_width) if str(min_width).strip() else None
        min_h_value = int(min_height) if str(min_height).strip() else None

        listrik = apply_demo_overrides(get_listrik(), lampu_visual, ac_visual)
        detected_person, persons, frame_out, fallback = detect_people_upload(
            frame, conf_value, min_w_value, min_h_value
        )
        person = detected_person
        manual_note = None
        if str(manual_people).strip() != "":
            person = max(0, int(float(manual_people)))
            manual_note = f"Jumlah orang dikoreksi manual dari {detected_person} menjadi {person}."

        response = build_detection_response(
            person, persons, frame_out, listrik,
            source="upload", fallback=fallback, save_log=True,
            user_id=None,
        )
        response["detected_orang"] = detected_person
        response["manual_override"] = manual_note
        response["kalibrasi"] = {
            "confidence": conf_value,
            "min_width": min_w_value,
            "min_height": min_h_value,
        }
        return response
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/waste/summary")
def waste_summary():
    """Ringkasan potensi pemborosan energi untuk kebutuhan analitik prototype."""
    try:
        conn = get_db()
        if not conn:
            return {"success": False, "message": "DB tidak tersedia"}
        cur = conn.cursor()
        cur.execute("""
            SELECT
                COUNT(*),
                SUM(kondisi='PEMBOROSAN'),
                SUM(kondisi='PERINGATAN'),
                AVG(COALESCE(risk_score, 0)),
                MAX(COALESCE(risk_score, 0))
            FROM logs
        """)
        total, pemborosan, peringatan, avg_risk, max_risk = cur.fetchone()
        cur.execute("""
            SELECT id, waktu, orang, lampu, ac, dispenser, kondisi, notifikasi, risk_score
            FROM logs
            WHERE kondisi IN ('PEMBOROSAN','PERINGATAN')
            ORDER BY id DESC
            LIMIT 10
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {
            "success": True,
            "total_log": int(total or 0),
            "total_pemborosan": int(pemborosan or 0),
            "total_peringatan": int(peringatan or 0),
            "avg_risk_score": round(float(avg_risk or 0), 2),
            "max_risk_score": int(max_risk or 0),
            "kasus_terbaru": [
                {
                    "id": r[0], "waktu": str(r[1]), "orang": int(r[2] or 0),
                    "lampu": r[3], "ac": r[4], "dispenser": r[5],
                    "kondisi": r[6], "notifikasi": r[7], "risk_score": int(r[8] or 0),
                }
                for r in rows
            ],
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.post("/detection/corrections")
async def save_detection_correction(request: Request):
    """Simpan koreksi manual untuk evaluasi akurasi deteksi."""
    try:
        body = await request.json()
        log_id = body.get("log_id")
        predicted_people = int(body.get("predicted_people") or 0)
        corrected_people = int(body.get("corrected_people") or 0)
        predicted_lampu = str(body.get("predicted_lampu") or "OFF").upper()
        corrected_lampu = str(body.get("corrected_lampu") or "OFF").upper()
        predicted_ac = str(body.get("predicted_ac") or "OFF").upper()
        corrected_ac = str(body.get("corrected_ac") or "OFF").upper()
        catatan = str(body.get("catatan") or "").strip()

        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "Database tidak tersedia"}, status_code=503)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO detection_corrections
                (log_id,predicted_people,corrected_people,predicted_lampu,corrected_lampu,
                 predicted_ac,corrected_ac,catatan)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            log_id, predicted_people, corrected_people, predicted_lampu, corrected_lampu,
            predicted_ac, corrected_ac, catatan
        ))
        conn.commit()
        correction_id = cur.lastrowid
        cur.close(); conn.close()
        return {"success": True, "id": correction_id, "message": "Koreksi tersimpan"}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/detection/evaluation")
def detection_evaluation():
    """Ringkasan evaluasi berdasarkan koreksi manual."""
    try:
        conn = get_db()
        if not conn:
            return {"success": False, "message": "Database tidak tersedia"}
        cur = conn.cursor()
        cur.execute("""
            SELECT
                COUNT(*),
                SUM(predicted_people = corrected_people),
                SUM(predicted_lampu = corrected_lampu),
                SUM(predicted_ac = corrected_ac),
                AVG(ABS(predicted_people - corrected_people))
            FROM detection_corrections
        """)
        total, people_ok, lampu_ok, ac_ok, avg_diff = cur.fetchone()
        cur.execute("""
            SELECT id, log_id, predicted_people, corrected_people, predicted_lampu, corrected_lampu,
                   predicted_ac, corrected_ac, catatan, created_at
            FROM detection_corrections
            ORDER BY id DESC
            LIMIT 10
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        total = int(total or 0)
        return {
            "success": True,
            "total_koreksi": total,
            "akurasi_orang": round((int(people_ok or 0) / total) * 100, 2) if total else 0,
            "akurasi_lampu": round((int(lampu_ok or 0) / total) * 100, 2) if total else 0,
            "akurasi_ac": round((int(ac_ok or 0) / total) * 100, 2) if total else 0,
            "rata_selisih_orang": round(float(avg_diff or 0), 2),
            "koreksi_terbaru": [
                {
                    "id": r[0], "log_id": r[1], "predicted_people": int(r[2] or 0),
                    "corrected_people": int(r[3] or 0), "predicted_lampu": r[4],
                    "corrected_lampu": r[5], "predicted_ac": r[6], "corrected_ac": r[7],
                    "catatan": r[8] or "", "created_at": str(r[9]) if r[9] else "",
                }
                for r in rows
            ],
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/status")
def status():
    """Polling ringan tiap 5 detik — data listrik IoT realtime."""
    try:
        l = apply_manual_kontrol(get_listrik())
        return {**l, "waktu": str(datetime.now()), "is_work": is_work()}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/history")
def history():
    """Riwayat 300 pengecekan terakhir."""
    try:
        conn = get_db()
        if not conn: return []
        cur = conn.cursor()
        cur.execute("""SELECT id,waktu,orang,lampu,ac,dispenser,kondisi,
            gambar,power_ac_w,power_lampu_w,notifikasi,sumber,metode_deteksi,
            confidence_avg,risk_score FROM logs ORDER BY id DESC LIMIT 300""")
        rows = cur.fetchall(); cur.close(); conn.close()
        return [
            {
                "id"           : r[0],
                "waktu"        : str(r[1]) if r[1] else "",
                "orang"        : r[2] or 0,
                "lampu"        : r[3] or "–",
                "ac"           : r[4] or "–",
                "dispenser"    : r[5] or "–",
                "kondisi"      : r[6] or "",
                "gambar"       : r[7],
                "gambar_url"   : f"/api/captures/{r[7]}" if r[7] else None,
                "power_ac_w"   : float(r[8] or 0),
                "power_lampu_w": float(r[9] or 0),
                "notifikasi"   : r[10] or "",
                "sumber"       : r[11] or "",
                "metode_deteksi": r[12] or "",
                "confidence_avg": float(r[13] or 0),
                "risk_score"   : int(r[14] or 0),
            }
            for r in rows
        ]
    except Exception as e:
        print(f"⚠️  /history: {e}"); return []

@app.get("/export/history.csv")
def export_history_csv():
    """Export riwayat deteksi untuk laporan dan analisis mitra."""
    try:
        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "Database tidak tersedia"}, status_code=503)
        cur = conn.cursor()
        cur.execute("""
            SELECT id,waktu,orang,lampu,ac,dispenser,kondisi,power_ac_w,power_lampu_w,
                   notifikasi,sumber,metode_deteksi,confidence_avg,risk_score
            FROM logs
            ORDER BY id DESC
            LIMIT 1000
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()

        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow([
            "id", "waktu", "orang", "lampu", "ac", "dispenser", "kondisi",
            "power_ac_w", "power_lampu_w", "notifikasi", "sumber",
            "metode_deteksi", "confidence_avg", "risk_score"
        ])
        for r in rows:
            writer.writerow([
                r[0], str(r[1]) if r[1] else "", int(r[2] or 0),
                r[3] or "", r[4] or "", r[5] or "", r[6] or "",
                float(r[7] or 0), float(r[8] or 0), r[9] or "",
                r[10] or "", r[11] or "", float(r[12] or 0), int(r[13] or 0),
            ])

        filename = f"hematrix-riwayat-{datetime.now().strftime('%Y%m%d-%H%M%S')}.csv"
        return Response(
            content=out.getvalue(),
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        print(f"export_history_csv: {e}")
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/energy/report")
def energy_report():
    """Laporan sederhana estimasi pemborosan energi untuk dashboard mitra."""
    try:
        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "Database tidak tersedia"}, status_code=503)
        cur = conn.cursor()
        cur.execute("""
            SELECT
                COUNT(*),
                SUM(kondisi='PEMBOROSAN'),
                SUM(kondisi='PERINGATAN'),
                SUM(CASE WHEN kondisi IN ('PEMBOROSAN','PERINGATAN')
                    THEN COALESCE(power_ac_w,0) + COALESCE(power_lampu_w,0)
                    ELSE 0 END),
                AVG(CASE WHEN kondisi IN ('PEMBOROSAN','PERINGATAN')
                    THEN COALESCE(risk_score,0) ELSE NULL END)
            FROM logs
        """)
        total, pemborosan, peringatan, waste_watt_sum, avg_risk = cur.fetchone()
        cur.execute("""
            SELECT HOUR(STR_TO_DATE(waktu, '%Y-%m-%d %H:%i:%s.%f')) AS jam, COUNT(*)
            FROM logs
            WHERE kondisi IN ('PEMBOROSAN','PERINGATAN')
            GROUP BY jam
            ORDER BY COUNT(*) DESC
            LIMIT 1
        """)
        peak = cur.fetchone()
        cur.close(); conn.close()

        interval_detik = int(float(settings_state.get("interval", "120") or 120))
        tarif = float(settings_state.get("tarifKwh", "1500") or 1500)
        waste_events = int((pemborosan or 0) + (peringatan or 0))
        estimasi_jam = round((waste_events * interval_detik) / 3600, 2)
        estimasi_kwh = round((float(waste_watt_sum or 0) * interval_detik) / 3600000, 4)
        estimasi_biaya = round(estimasi_kwh * tarif, 0)

        return {
            "success": True,
            "total_log": int(total or 0),
            "total_pemborosan": int(pemborosan or 0),
            "total_peringatan": int(peringatan or 0),
            "estimasi_durasi_jam": estimasi_jam,
            "estimasi_kwh_terbuang": estimasi_kwh,
            "estimasi_biaya": estimasi_biaya,
            "avg_risk_score": round(float(avg_risk or 0), 2),
            "jam_rawan": f"{int(peak[0]):02d}:00" if peak and peak[0] is not None else "-",
            "rekomendasi": "Prioritaskan pemeriksaan ruangan pada jam rawan dan matikan perangkat saat ruangan kosong.",
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/notifications/actions")
def get_notification_actions():
    """Ambil status tindak lanjut untuk setiap log notifikasi."""
    try:
        conn = get_db()
        if not conn:
            return {}
        cur = conn.cursor()
        cur.execute("SELECT log_id,status,catatan,updated_at FROM notification_actions")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {
            str(r[0]): {
                "status": r[1] or "BARU",
                "catatan": r[2] or "",
                "updated_at": str(r[3]) if r[3] else "",
            }
            for r in rows
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.post("/notifications/actions")
async def save_notification_action(request: Request):
    """Simpan status tindak lanjut notifikasi: BARU, DICEK, SELESAI, DIABAIKAN."""
    try:
        body = await request.json()
        log_id = int(body.get("log_id"))
        status = str(body.get("status") or "BARU").upper()
        catatan = str(body.get("catatan") or "").strip()
        if status not in ("BARU", "DICEK", "SELESAI", "DIABAIKAN"):
            return JSONResponse({"success": False, "message": "Status tidak valid"}, status_code=400)
        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "Database tidak tersedia"}, status_code=503)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO notification_actions (log_id,status,catatan)
            VALUES (%s,%s,%s)
            ON DUPLICATE KEY UPDATE status=VALUES(status), catatan=VALUES(catatan)
        """, (log_id, status, catatan))
        conn.commit()
        cur.close(); conn.close()
        return {"success": True, "log_id": log_id, "status": status, "catatan": catatan}
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/summary")
def summary():
    """Ringkasan kondisi seluruh data."""
    try:
        conn = get_db()
        if not conn:
            return {"total":0,"normal":0,"pemborosan":0,"peringatan":0,"aman":0}
        cur = conn.cursor()
        cur.execute("""SELECT COUNT(*),
            SUM(kondisi='NORMAL'), SUM(kondisi='PEMBOROSAN'),
            SUM(kondisi='PERINGATAN'), SUM(kondisi='AMAN') FROM logs""")
        r = cur.fetchone(); cur.close(); conn.close()
        return {
            "total"     : int(r[0] or 0),
            "normal"    : int(r[1] or 0),
            "pemborosan": int(r[2] or 0),
            "peringatan": int(r[3] or 0),
            "aman"      : int(r[4] or 0),
        }
    except Exception as e:
        print(f"⚠️  /summary: {e}")
        return {"total":0,"normal":0,"pemborosan":0,"peringatan":0,"aman":0}

@app.get("/listrik/history")
def listrik_history():
    """Riwayat konsumsi listrik untuk grafik."""
    try:
        conn = get_db()
        if not conn: return []
        cur = conn.cursor()
        cur.execute("""SELECT device_id, power, today_kwh, voltage, current, time_recorded
            FROM data_keseluruhan
            WHERE device_id IN ('4B8A13','75AA3A','939788')
            ORDER BY log_id DESC LIMIT 200""")
        rows = cur.fetchall(); cur.close(); conn.close()
        return [
            {
                "device_id"    : r[0],
                "power_w"      : round(float(r[1] or 0) / 1000, 2),
                "today_kwh"    : float(r[2] or 0),
                "voltage"      : float(r[3] or 0),
                "current_a"    : round(float(r[4] or 0) / 1000, 3),
                "time_recorded": str(r[5]) if r[5] else "",
            }
            for r in rows
        ]
    except Exception as e:
        print(f"⚠️  /listrik/history: {e}"); return []

@app.get("/health")
def health():
    db_ok = False
    try:
        conn = get_db()
        db_ok = conn is not None
        if conn: conn.close()
    except: pass
    cam_cfg = current_camera_config()
    return {
        "status"     : "ok",
        "versi"      : "v2.1.0",
        "model"      : MODEL_PATH,
        "yolo_ready" : model is not None,
        "db"         : db_ok,
        "is_work"    : is_work(),
        "waktu"      : str(datetime.now()),
        "cam_config" : {
            "index"     : CAM_INDEX,
            "backend"   : "MSMF",
            "resolusi"  : f"{CAM_WIDTH}x{CAM_HEIGHT}",
            "confidence": CONFIDENCE,
            "min_width" : MIN_WIDTH,
            "min_height": MIN_HEIGHT,
            "source"    : cam_cfg["source"],
            "active"    : cam_cfg["label"],
        }
    }

# AUTH ENDPOINTS — Tambahkan ke main.py setelah endpoint /health
# Tabel users: id, email, password, nama, role, created_at
# ═════════════════════════════════════════════════════════════

from fastapi import Request
import hashlib, secrets

# Simple in-memory session store
# (untuk production gunakan JWT atau Redis)
active_sessions = {}

DEFAULT_SETTINGS = {
    "namaLokasi": "Ruang Dosen - Gedung 4 Sesi A & Dosen",
    "jamMulai": "08:00",
    "jamSelesai": "16:30",
    "zona": "WIB",
    "interval": "120",
    "confidence": "0.35",
    "thresholdAC": "5000",
    "thresholdLampu": "200",
    "cameraSource": "webcam",
    "cameraIndex": "0",
    "cameraBackend": "MSMF",
    "cameraUrl": "",
    "tarifKwh": "1500",
}
settings_state = DEFAULT_SETTINGS.copy()

def normalize_role(role):
    role = (role or "").strip().lower()
    if role in ("admin", "administrator"):
        return "admin"
    if role == "operator":
        return "operator"
    return "viewer"

def get_session_from_request(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    return active_sessions.get(token)

def is_admin_session(session):
    return normalize_role(session.get("role")) == "admin" if session else False

def hash_password(pw: str) -> str:
    """Hash password dengan SHA-256."""
    return hashlib.sha256(pw.encode()).hexdigest()

# ─────────────────────────────────────────────────────────────
# ENDPOINT: POST /auth/login
# Body: { "email": "...", "password": "..." }
# ─────────────────────────────────────────────────────────────
@app.post("/auth/login")
async def auth_login(request: Request):
    try:
        body = await request.json()
        email    = body.get("email", "").strip().lower()
        password = body.get("password", "").strip()

        if not email or not password:
            return JSONResponse(
                {"success": False, "message": "Email dan password wajib diisi"},
                status_code=400
            )

        conn = get_db()
        if not conn:
            return JSONResponse(
                {"success": False, "message": "Koneksi database gagal"},
                status_code=500
            )

        cur = conn.cursor()

        # Coba login dengan password plain text dulu (sesuai data di DB)
        # Jika password di DB sudah di-hash, ganti dengan hash_password(password)
        cur.execute(
            "SELECT id, email, password, nama, role, created_at FROM users WHERE email = %s LIMIT 1",
            (email,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return JSONResponse(
                {"success": False, "message": "Email tidak ditemukan"},
                status_code=401
            )

        db_id, db_email, db_password, db_nama, db_role, db_created = user

        # Cek password (plain text match atau hash match)
        password_ok = (password == db_password) or (hash_password(password) == db_password)

        if not password_ok:
            return JSONResponse(
                {"success": False, "message": "Password salah"},
                status_code=401
            )

        # Buat session token
        token = secrets.token_hex(32)
        active_sessions[token] = {
            "id"        : db_id,
            "email"     : db_email,
            "nama"      : db_nama,
            "role"      : db_role,
            "created_at": str(db_created),
            "login_at"  : str(datetime.now()),
        }

        return JSONResponse({
            "success": True,
            "message": f"Selamat datang, {db_nama}!",
            "token"  : token,
            "user"   : {
                "id"   : db_id,
                "email": db_email,
                "nama" : db_nama,
                "role" : db_role,
            }
        })

    except Exception as e:
        print(f"⚠️  /auth/login error: {e}")
        return JSONResponse(
            {"success": False, "message": f"Server error: {str(e)}"},
            status_code=500
        )

# ─────────────────────────────────────────────────────────────
# ENDPOINT: POST /auth/logout
# Header: Authorization: Bearer <token>
# ─────────────────────────────────────────────────────────────
@app.post("/auth/logout")
async def auth_logout(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if token in active_sessions:
        del active_sessions[token]
    return {"success": True, "message": "Logout berhasil"}

# ─────────────────────────────────────────────────────────────
# ENDPOINT: GET /auth/me
# Header: Authorization: Bearer <token>
# ─────────────────────────────────────────────────────────────
@app.get("/auth/me")
async def auth_me(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if token in active_sessions:
        return {"success": True, "user": active_sessions[token]}
    return JSONResponse({"success": False, "message": "Tidak terautentikasi"}, status_code=401)

# ─────────────────────────────────────────────────────────────
# ENDPOINT: GET /auth/users  (hanya Administrator)
# ─────────────────────────────────────────────────────────────
@app.get("/auth/users")
async def get_users(request: Request):
    auth = request.headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()

    session = active_sessions.get(token)
    if not session:
        return JSONResponse({"success": False, "message": "Tidak terautentikasi"}, status_code=401)
    if not is_admin_session(session):
        return JSONResponse({"success": False, "message": "Akses ditolak"}, status_code=403)

    try:
        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "DB error"}, status_code=500)
        cur = conn.cursor()
        cur.execute("SELECT id, email, nama, role, created_at FROM users ORDER BY id")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {
            "success": True,
            "users": [
                {"id": r[0], "email": r[1], "nama": r[2], "role": r[3], "created_at": str(r[4])}
                for r in rows
            ]
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

# ─────────────────────────────────────────────────────────────
# ENDPOINT: POST /auth/register  (tambah user baru)
# ─────────────────────────────────────────────────────────────
@app.post("/auth/register")
async def auth_register(request: Request):
    try:
        body  = await request.json()
        email = body.get("email","").strip().lower()
        password = body.get("password","").strip()
        nama  = body.get("nama","").strip()
        role  = body.get("role","viewer").strip()

        if not email or not password or not nama:
            return JSONResponse({"success": False, "message": "Data tidak lengkap"}, status_code=400)

        session = get_session_from_request(request)
        if not session:
            return JSONResponse({"success": False, "message": "Tidak terautentikasi"}, status_code=401)
        if not is_admin_session(session):
            return JSONResponse({"success": False, "message": "Akses ditolak"}, status_code=403)

        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "DB error"}, status_code=500)

        cur = conn.cursor()
        # Cek email duplikat
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close(); conn.close()
            return JSONResponse({"success": False, "message": "Email sudah terdaftar"}, status_code=409)

        cur.execute(
            "INSERT INTO users (email, password, nama, role) VALUES (%s, %s, %s, %s)",
            (email, password, nama, role)
        )
        conn.commit()
        new_id = cur.lastrowid
        cur.close(); conn.close()

        return JSONResponse({"success": True, "message": "User berhasil didaftarkan", "id": new_id})
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)


@app.put("/auth/users/{user_id}")
async def update_user(user_id: int, request: Request):
    session = get_session_from_request(request)
    if not session:
        return JSONResponse({"success": False, "message": "Tidak terautentikasi"}, status_code=401)
    if not is_admin_session(session):
        return JSONResponse({"success": False, "message": "Akses ditolak"}, status_code=403)

    try:
        body = await request.json()
        email = body.get("email", "").strip().lower()
        nama = body.get("nama", "").strip()
        role = body.get("role", "viewer").strip()
        password = body.get("password", "").strip()

        if not email or not nama:
            return JSONResponse({"success": False, "message": "Email dan nama wajib diisi"}, status_code=400)
        if role not in ("admin", "operator", "viewer"):
            role = "viewer"

        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "DB error"}, status_code=500)

        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s AND id != %s", (email, user_id))
        if cur.fetchone():
            cur.close(); conn.close()
            return JSONResponse({"success": False, "message": "Email sudah terdaftar"}, status_code=409)

        updates = ["email = %s", "nama = %s", "role = %s"]
        params = [email, nama, role]
        if password:
            updates.append("password = %s")
            params.append(password)
        params.append(user_id)

        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", tuple(params))
        conn.commit()
        updated = cur.rowcount
        cur.close(); conn.close()

        if updated == 0:
            return JSONResponse({"success": False, "message": "User tidak ditemukan"}, status_code=404)

        return {"success": True, "message": "User berhasil diperbarui"}
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)


@app.post("/auth/public-register")
async def auth_public_register(request: Request):
    """Registrasi mandiri untuk prototype pengguna mobile/web."""
    try:
        body = await request.json()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "").strip()
        nama = body.get("nama", "").strip()
        role = body.get("role", "viewer").strip().lower() or "viewer"

        if role not in ("viewer", "operator"):
            role = "viewer"
        if not nama or len(nama) < 3:
            return JSONResponse({"success": False, "message": "Nama minimal 3 karakter"}, status_code=400)
        if "@" not in email or "." not in email:
            return JSONResponse({"success": False, "message": "Format email tidak valid"}, status_code=400)
        if len(password) < 6:
            return JSONResponse({"success": False, "message": "Password minimal 6 karakter"}, status_code=400)

        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "Koneksi database gagal"}, status_code=500)

        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return JSONResponse({"success": False, "message": "Email sudah terdaftar"}, status_code=409)

        cur.execute(
            "INSERT INTO users (email, password, nama, role) VALUES (%s, %s, %s, %s)",
            (email, password, nama, role),
        )
        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        conn.close()

        return JSONResponse({
            "success": True,
            "message": "Akun berhasil dibuat. Silakan masuk.",
            "id": new_id,
        })
    except Exception as e:
        return JSONResponse({"success": False, "message": f"Server error: {str(e)}"}, status_code=500)


@app.post("/auth/forgot-password")
async def auth_forgot_password(request: Request):
    """Reset password demo. Untuk produksi, ganti dengan email token sekali pakai."""
    try:
        body = await request.json()
        email = body.get("email", "").strip().lower()
        if "@" not in email or "." not in email:
            return JSONResponse({"success": False, "message": "Format email tidak valid"}, status_code=400)

        return JSONResponse({
            "success": True,
            "message": "Instruksi reset kata sandi sudah disiapkan untuk akun tersebut.",
        })
    except Exception as e:
        return JSONResponse({"success": False, "message": f"Server error: {str(e)}"}, status_code=500)
# ═════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════
# ═════════════════════════════════════════════════════════════
@app.delete("/auth/users/{user_id}")
async def delete_user(user_id: int, request: Request):
    session = get_session_from_request(request)
    if not session:
        return JSONResponse({"success": False, "message": "Tidak terautentikasi"}, status_code=401)
    if not is_admin_session(session):
        return JSONResponse({"success": False, "message": "Akses ditolak"}, status_code=403)
    if int(session.get("id", 0)) == user_id:
        return JSONResponse({"success": False, "message": "Tidak bisa menghapus akun sendiri"}, status_code=400)

    try:
        conn = get_db()
        if not conn:
            return JSONResponse({"success": False, "message": "DB error"}, status_code=500)
        cur = conn.cursor()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        deleted = cur.rowcount
        cur.close(); conn.close()
        if deleted == 0:
            return JSONResponse({"success": False, "message": "User tidak ditemukan"}, status_code=404)
        return {"success": True, "message": "User berhasil dihapus"}
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.get("/settings")
def get_settings():
    return settings_state

@app.post("/settings")
async def save_settings(request: Request):
    try:
        body = await request.json()
        allowed = set(DEFAULT_SETTINGS.keys())
        settings_state.update({k: str(v) for k, v in body.items() if k in allowed})
        return {"success": True, **settings_state}
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

# KONTROL PERANGKAT — tambahkan ke main.py setelah endpoint /health
# ═════════════════════════════════════════════════════════════

# State kontrol in-memory
# mode: "otomatis" = simulator pakai logika jam+orang
#        "manual"  = simulator pakai nilai dari sini
kontrol_state = {
    "mode"      : "otomatis",  # "otomatis" | "manual"
    "ac"        : None,        # True=ON, False=OFF, None=ikut otomatis
    "lampu"     : None,
    "dispenser" : None,
}

@app.get("/kontrol")
def get_kontrol():
    """Ambil status kontrol saat ini."""
    return {**kontrol_state, "success": True}

@app.post("/kontrol")
async def set_kontrol(request: Request):
    """
    Set ON/OFF satu perangkat secara manual.
    Body: { "perangkat": "ac"|"lampu"|"dispenser", "nilai": true|false }
    """
    try:
        body      = await request.json()
        perangkat = body.get("perangkat", "").lower()
        nilai     = body.get("nilai")  # True atau False

        if perangkat not in ("ac", "lampu", "dispenser"):
            return JSONResponse({"success": False, "message": "Perangkat tidak valid"}, status_code=400)
        if not isinstance(nilai, bool):
            return JSONResponse({"success": False, "message": "Nilai harus true atau false"}, status_code=400)

        kontrol_state[perangkat] = nilai
        kontrol_state["mode"]    = "manual"

        status_str = "ON" if nilai else "OFF"
        print(f"🕹️  Kontrol manual: {perangkat.upper()} → {status_str}")
        return {"success": True, "perangkat": perangkat, "nilai": nilai, "mode": "manual"}

    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)

@app.post("/kontrol/mode")
async def set_mode(request: Request):
    """
    Ganti mode otomatis/manual.
    Body: { "mode": "otomatis" | "manual" }
    """
    try:
        body = await request.json()
        mode = body.get("mode", "otomatis").lower()

        if mode not in ("otomatis", "manual"):
            return JSONResponse({"success": False, "message": "Mode tidak valid"}, status_code=400)

        kontrol_state["mode"] = mode
        if mode == "otomatis":
            # Reset semua override
            kontrol_state["ac"]        = None
            kontrol_state["lampu"]     = None
            kontrol_state["dispenser"] = None

        print(f"🔄 Mode diganti ke: {mode.upper()}")
        return {"success": True, "mode": mode}

    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)}, status_code=500)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
