"""
Test akurasi YOLO pada foto kampus
Jalankan: python test_yolo.py
"""
from ultralytics import YOLO
import os

model = YOLO("yolo11n.pt")

FOLDER = "sample_photos/normal"
CONFIDENCE = 0.25
MIN_WIDTH  = 30
MIN_HEIGHT = 50

foto_list = [f for f in os.listdir(FOLDER) if f.lower().endswith((".jpg",".jpeg",".png"))]

print(f"Test YOLO confidence={CONFIDENCE} pada {len(foto_list)} foto\n")
print(f"{'No':<4} {'Foto':<50} {'Orang'}")
print("-" * 65)

for i, foto in enumerate(foto_list[:10]):
    path = os.path.join(FOLDER, foto)
    results = model(path, conf=CONFIDENCE, verbose=False)
    count = 0
    for r in results:
        if r.boxes:
            for box in r.boxes:
                if int(box.cls[0]) == 0:
                    x1,y1,x2,y2 = map(int, box.xyxy[0])
                    w_box = x2 - x1
                    h_box = y2 - y1
                    if w_box >= 30 and h_box >= 50:  # filter ukuran
                        count += 1
    print(f"{i+1:<4} {foto[:48]:<50} {count}")

print("\nKalau hasilnya terlalu banyak → naikkan CONFIDENCE")
print("Kalau hasilnya terlalu sedikit → turunkan CONFIDENCE")