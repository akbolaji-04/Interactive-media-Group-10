# This script will compress all PNG images in the 'images' folder to be under 1MB (if possible),
# and save the compressed versions as JPEGs with the same base name.
# Requires Python 3 and Pillow (pip install pillow)

import os
from PIL import Image

IMG_DIR = 'images'
MAX_SIZE = 1024 * 1024  # 1MB
MAX_WIDTH = 800
QUALITY = 85

for fname in os.listdir(IMG_DIR):
    if fname.lower().endswith('.png'):
        path = os.path.join(IMG_DIR, fname)
        with Image.open(path) as img:
            # Resize if too wide
            w, h = img.size
            if w > MAX_WIDTH:
                h = int(h * (MAX_WIDTH / w))
                w = MAX_WIDTH
                img = img.resize((w, h), Image.LANCZOS)
            # Convert to RGB (JPEG doesn't support alpha)
            if img.mode in ('RGBA', 'LA'):
                bg = Image.new('RGB', img.size, (255,255,255))
                bg.paste(img, mask=img.split()[-1])
                img = bg
            else:
                img = img.convert('RGB')
            # Save as JPEG, reduce quality if needed
            out_path = os.path.join(IMG_DIR, fname.replace('.png', '.jpg'))
            q = QUALITY
            while True:
                img.save(out_path, 'JPEG', quality=q)
                if os.path.getsize(out_path) <= MAX_SIZE or q < 40:
                    break
                q -= 5
            print(f"Compressed {fname} to {out_path} ({os.path.getsize(out_path)//1024} KB, quality={q})")
print('Done!')
