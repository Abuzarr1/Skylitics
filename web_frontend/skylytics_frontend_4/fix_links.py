import os

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r') as file:
                content = file.read()
            if 'href="/login?redirect=/manager"' in content:
                content = content.replace('href="/login?redirect=/manager"', 'href="/manager"')
                with open(path, 'w') as file:
                    file.write(content)
                    print(f"Fixed links in {path}")
