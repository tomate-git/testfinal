import json
import os

content_path = os.path.join('public', 'galerie', 'content.json')

if os.path.exists(content_path):
    with open(content_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Keys: {list(data.keys())}")
    if 'events' in data:
        print(f"Number of events: {len(data['events'])}")
        if len(data['events']) > 0:
            evt = data['events'][0]
            # Print structure but truncate image
            evt_copy = evt.copy()
            if 'eventImage' in evt_copy and evt_copy['eventImage'] and len(evt_copy['eventImage']) > 100:
                evt_copy['eventImage'] = evt_copy['eventImage'][:50] + '...'
            print(f"First event: {evt_copy}")
