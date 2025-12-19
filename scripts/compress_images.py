import os
import shutil
from PIL import Image

# Configuration
SOURCE_DIR = os.path.join('public', 'galerie')
BACKUP_DIR = os.path.join('public', 'galerie', 'backup')
MAX_WIDTH = 1920
QUALITY = 80

def compress_images():
    # Create backup directory
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

    # Process images
    for filename in os.listdir(SOURCE_DIR):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            filepath = os.path.join(SOURCE_DIR, filename)
            backup_path = os.path.join(BACKUP_DIR, filename)

            # Backup
            if not os.path.exists(backup_path):
                shutil.copy2(filepath, backup_path)
                print(f"Backed up: {filename}")

            try:
                with Image.open(filepath) as img:
                    # Convert RGBA to RGB if necessary (for JPEG saving)
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')

                    # Resize if needed
                    if img.width > MAX_WIDTH:
                        ratio = MAX_WIDTH / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
                        print(f"Resized {filename} to {MAX_WIDTH}px width")

                    # Save compressed
                    img.save(filepath, optimize=True, quality=QUALITY)
                    
                    original_size = os.path.getsize(backup_path) / 1024 / 1024
                    new_size = os.path.getsize(filepath) / 1024 / 1024
                    print(f"Compressed {filename}: {original_size:.2f}MB -> {new_size:.2f}MB")

            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    print("Starting image compression...")
    compress_images()
    print("Compression complete.")
