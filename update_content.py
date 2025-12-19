import json
import os

content_path = r'c:\Users\sandr\Desktop\ESS SITE V3\public\galerie\content.json'

# Mapping based on analysis
image_mapping = {
    'communaute': 'espace comunauraire 1.jpg',
    'espace-media': 'epsace comunautaire 2.jpg',
    'studio-creatif': 'studio.jpg',
    'open-zone': 'coworking.jpg',
    'kiosque-4': 'kiosque vue emsemble.jpg',
    'container-3': 'Container Pro.jpg',
    'green-room': 'grenn room.jpg',
    'espace-beaute': 'espace beauté.jpg',
    'salle-focus': 'logo.png',
    'kiosque-1': 'kiosque.jpg',
    'container-1': 'Container Pro.jpg',
    'container-2': 'Container Pro.jpg',
    'kiosque-2': 'kiosque 2.jpg',
    'kiosque-5': 'kiosque vue emsemble.jpg',
    'kiosque-3': 'kiosque 3.jpg'
}

try:
    with open(content_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if 'spaces' in data:
        for space in data['spaces']:
            space_id = space.get('id')
            if space_id in image_mapping:
                # Use /galerie/ prefix as these are served from public/galerie
                # We keep the filename as is.
                # If the frontend needs URL encoding, it usually handles it or we can encode it here.
                # But typically <img src="/galerie/File Name.jpg"> works.
                # Let's verify if we should encode. The previous code used base64.
                # Let's stick to simple paths first.
                space['image'] = f"/galerie/{image_mapping[space_id]}"
                print(f"Updated {space_id} to {space['image']}")
            else:
                print(f"No mapping for {space_id}, keeping original (or setting default)")
                # Optional: set a default if original is base64 and we want to clear it
                # space['image'] = "/galerie/logo.png" 
    
    with open(content_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Successfully updated content.json")

except Exception as e:
    print(f"Error: {e}")
