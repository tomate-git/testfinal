import json
import os

content_path = r'c:\Users\sandr\Desktop\ESS SITE V3\public\galerie\content.json'

try:
    with open(content_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    with open(r'c:\Users\sandr\Desktop\ESS SITE V3\spaces_list_py.txt', 'w', encoding='utf-8') as outfile:
        if 'spaces' in data:
            outfile.write("Spaces found:\n")
            for space in data['spaces']:
                outfile.write(f"ID: {space.get('id')}, Name: {space.get('name')}\n")
        else:
            outfile.write("No 'spaces' key found in JSON.\n")

except Exception as e:
    print(f"Error: {e}")
