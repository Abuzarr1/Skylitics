import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    
    # Text
    content = re.sub(r'\btext-foreground\b', 'dark:text-white text-black', content)
    
    # Borders
    content = re.sub(r'\bborder-foreground/(\d+)\b', r'dark:border-white/\1 border-black/\1', content)

    # Backgrounds
    content = re.sub(r'\bbg-foreground/(\d+)\b', r'dark:bg-white/\1 bg-black/\1', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

