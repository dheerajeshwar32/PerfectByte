
import os, glob

for f in glob.glob('src/**/*.tsx', recursive=True):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    new_content = content.replace('dark:to-black', 'dark:to-[#050810]')
    new_content = new_content.replace('dark:bg-black', 'dark:bg-[#050810]')
    new_content = new_content.replace('ring-black/5', 'ring-slate-900/5')
    
    if content != new_content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f'Updated {f}')

