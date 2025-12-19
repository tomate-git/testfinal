import json
import os

content_path = os.path.join('public', 'galerie', 'content.json')
galerie_prefix = '/galerie/'

mapping = {
    'communaute': 'espace-communautaire-1.jpg',
    'espace-media': 'espace-communautaire-2.jpg',
    'studio-creatif': 'studio.jpg',
    'open-zone': 'coworking.jpg',
    'kiosque-4': 'kiosque-vue-ensemble.jpg',
    'container-3': 'container-pro.jpg',
    'green-room': 'green-room.jpg',
    'espace-beaute': 'espace-beaute.jpg',
    'salle-focus': 'coworking.jpg', # Fallback
    'kiosque-1': 'kiosque.jpg',
    'container-1': 'container-pro.jpg',
    'container-2': 'container-pro.jpg',
    'kiosque-2': 'kiosque-2.jpg',
    'kiosque-5': 'kiosque-2.jpg',
    'kiosque-3': 'kiosque-3.jpg'
}

if os.path.exists(content_path):
    try:
        with open(content_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if 'spaces' in data:
            for space in data['spaces']:
                sid = space.get('id')
                current_image = space.get('image', '')
                
                # If it's base64, we MUST fix it
                is_base64 = current_image.startswith('data:image')
                
                if sid in mapping:
                    space['image'] = galerie_prefix + mapping[sid]
                    print(f"Updated space '{sid}' image to '{space['image']}'")
                elif is_base64:
                    print(f"Found base64 image for space '{sid}' with current image '{current_image}'. No mapping found, using default '/logo.png'.")
                    space['image'] = '/logo.png'
                else:
                    print(f"Space '{sid}' has image '{current_image}' (not base64, no mapping needed).")
        
        with open(content_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Successfully updated content.json")
        
    except Exception as e:
        print(f"Error updating content.json: {e}")
else:
    print("content.json not found")
