"""
Hematrik Smart Room Monitoring - auto_capture.py
Tugasnya HANYA: baca webcam → kirim ke API /detect
TIDAK ada logic deteksi / AI di sini.
"""

import cv2
import requests
import time

# ============================================================
# KONFIGURASI
# ============================================================
API_URL        = "http://127.0.0.1:8000/detect"
CAPTURE_DELAY  = 2      # detik antar pengiriman (sesuaikan kebutuhan)
SHOW_PREVIEW   = False   # tampilkan jendela kamera lokal
TIMEOUT        = 8      # timeout request ke API (detik)

# ============================================================
# BUKA KAMERA (SATU-SATUNYA TEMPAT)
# ============================================================
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cap.isOpened():
    print("❌ Kamera tidak bisa dibuka. Pastikan tidak dipakai aplikasi lain.")
    exit(1)

# Resolusi optimal (turunkan jika perlu lebih cepat)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("✅ Kamera berhasil dibuka")
print(f"📡 Mengirim ke: {API_URL}")
print("🔵 Tekan 'q' untuk berhenti\n")

# ============================================================
# MAIN LOOP
# ============================================================
last_send_time = 0

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Gagal ambil frame, mencoba lagi...")
        time.sleep(1)
        continue

    # Tampilkan preview kamera lokal
    if SHOW_PREVIEW:
        cv2.imshow("Hematrik - Camera Preview (q = quit)", frame)

    # Kirim ke API sesuai interval
    current_time = time.time()
    if current_time - last_send_time >= CAPTURE_DELAY:
        last_send_time = current_time

        try:
            # Encode frame ke JPEG
            ok, img_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ok:
                print("⚠️ Gagal encode frame, skip")
                continue

            # Kirim ke API
            response = requests.post(
                API_URL,
                files={"file": ("image.jpg", img_encoded.tobytes(), "image/jpeg")},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(
                        f"[{time.strftime('%H:%M:%S')}] "
                        f"👤 Orang: {data['people_count']} | "
                        f"💡 Listrik: {data['status_listrik']} | "
                        f"📊 Kondisi: {data['kondisi']} | "
                        f"{data['notifikasi']}"
                    )
                else:
                    print(f"⚠️ API error: {data.get('error')}")
            else:
                print(f"⚠️ HTTP {response.status_code}: {response.text[:80]}")

        except requests.exceptions.Timeout:
            print("⏱️ Request timeout, skip frame ini")
        except requests.exceptions.ConnectionError:
            print("🔌 Tidak bisa konek ke API, pastikan server jalan (uvicorn main:app)")
        except Exception as e:
            print(f"❌ Error tidak terduga: {e}")

    # Keluar dengan 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("\n🛑 Dihentikan oleh pengguna")
        break

# ============================================================
# CLEANUP
# ============================================================
cap.release()
cv2.destroyAllWindows()
print("✅ Kamera dilepas. Program selesai.")
