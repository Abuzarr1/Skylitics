import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # Precise revert
    content = re.sub(r'dark:text-white text-black', 'text-white', content)
    content = re.sub(r'dark:border-white/(\d+) border-black/\1', r'border-white/\1', content)
    content = re.sub(r'dark:bg-white/(\d+) bg-black/\1', r'bg-white/\1', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Reverted {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

