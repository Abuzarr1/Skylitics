import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace straight text-white with text-foreground
    new_content = re.sub(r'\btext-white\b', 'text-foreground', content)
    
    # Replace border-white/X with border-foreground/X
    new_content = re.sub(r'\bborder-white/(\d+)\b', r'border-foreground/\1', new_content)

    # Replace bg-white/X with bg-foreground/X
    new_content = re.sub(r'\bbg-white/(\d+)\b', r'bg-foreground/\1', new_content)

    # Replace text-black with text-background (or just leave it if it's on accent-neon)
    # Actually, neon is always #DFFF00, so text-black on it is always good.

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

