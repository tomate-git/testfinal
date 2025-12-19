import os
import shutil

# Directory containing images
galerie_dir = os.path.join('public', 'galerie')

# Mapping of current filename (or potential filename) to new filename
# Based on LS output and spaces.ts needs
renames = {
    'kiosque 2.jpg': 'kiosque-2.jpg',
    'kiosque 3.jpg': 'kiosque-3.jpg',
    'epsace comunautaire 2.jpg': 'espace-communautaire-2.jpg', # Typo in code, checking if file exists with bad name or good name
    'espace beauté.jpg': 'espace-beaute.jpg',
    'kiosque vue emsemble.jpg': 'kiosque-vue-ensemble.jpg',
    'Container Pro.jpg': 'container-pro.jpg', # Ensure lowercase
    'grenn room.jpg': 'green-room.jpg', # Fix typo
}

# Also handle existing files that might need normalization (spaces to hyphens, lowercase)
if os.path.exists(galerie_dir):
    files = os.listdir(galerie_dir)
    print(f"Current files in {galerie_dir}:")
    for f in files:
        print(f" - {f}")
        
    print("\nStarting rename process...")
    
    for filename in files:
        # Skip directories
        if os.path.isdir(os.path.join(galerie_dir, filename)):
            continue
            
        new_name = filename.lower().replace(' ', '-')
        
        # Specific overrides/fixes
        if filename == 'epsace comunautaire 2.jpg':
            new_name = 'espace-communautaire-2.jpg'
        elif filename == 'grenn room.jpg':
            new_name = 'green-room.jpg'
        elif filename == 'espace beauté.jpg':
            new_name = 'espace-beaute.jpg'
            
        if new_name != filename:
            old_path = os.path.join(galerie_dir, filename)
            new_path = os.path.join(galerie_dir, new_name)
            
            if os.path.exists(new_path):
                print(f"Skipping {filename} -> {new_name} (Target exists)")
            else:
                try:
                    os.rename(old_path, new_path)
                    print(f"Renamed: {filename} -> {new_name}")
                except Exception as e:
                    print(f"Error renaming {filename}: {e}")
else:
    print(f"Directory not found: {galerie_dir}")
