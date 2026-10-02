import os
import glob

# Search for the layout bug pattern in all tsx files
files = glob.glob('src/*.tsx')

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The issue is "w-full ... mx-4" in the main wrapper card
    # We replace "w-full" + "mx-4" -> "w-[calc(100%-2rem)]" + "mx-auto"
    if 'max-w-5xl w-full text-center relative z-10 mt-4 mx-4' in content:
        content = content.replace(
            'max-w-5xl w-full text-center relative z-10 mt-4 mx-4',
            'max-w-5xl w-[calc(100%-2rem)] mx-auto text-center relative z-10 mt-4'
        )
    if 'max-w-5xl w-full flex flex-col relative overflow-hidden z-10 mt-4 mx-4' in content:
        content = content.replace(
            'max-w-5xl w-full flex flex-col relative overflow-hidden z-10 mt-4 mx-4',
            'max-w-5xl w-[calc(100%-2rem)] mx-auto flex flex-col relative overflow-hidden z-10 mt-4'
        )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Layout bug fixed across all files.")
