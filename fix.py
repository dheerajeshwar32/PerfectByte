import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# History.tsx
replace_in_file('src/History.tsx', [
    ('clearHistory, HistoryEntry', 'clearHistory, type HistoryEntry'),
    ('import useDocumentTitle from', 'import { useDocumentTitle } from')
])

# FormatConverter.tsx
replace_in_file('src/FormatConverter.tsx', [
    ('import useDocumentTitle from', 'import { useDocumentTitle } from'),
    ('encodeAvif(imageData, { cqLevel: Math.round(63 - (quality / 100) * 63) })', 'encodeAvif(imageData as any, { quality })')
])

# ImageResizer.tsx
replace_in_file('src/ImageResizer.tsx', [
    ('import React, { useState, useRef, useEffect, useCallback }', 'import { useState }'),
    ('import { Navbar }', 'import Navbar'),
    ('export const ImageResizer: React.FC = () => {', 'export default function ImageResizer() {'),
    ('formatBytes(file.size)', 'formatBytes(file!.size)'),
    ('file.name.replace', 'file!.name.replace')
])

# ImageResizer.tsx closing brace (hacky but works)
with open('src/ImageResizer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if c.endswith('};\n'):
    c = c[:-3] + '}\n'
elif c.endswith('};'):
    c = c[:-2] + '}'
with open('src/ImageResizer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# PdfTools.tsx
replace_in_file('src/PdfTools.tsx', [
    ('import { Navbar }', 'import Navbar'),
    ('export const PdfTools: React.FC = () => {', 'export default function PdfTools() {'),
    ('new Blob([pdfBytes]', 'new Blob([pdfBytes as BlobPart]')
])

# PdfTools.tsx closing brace
with open('src/PdfTools.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
if c.endswith('};\n'):
    c = c[:-3] + '}\n'
elif c.endswith('};'):
    c = c[:-2] + '}'
with open('src/PdfTools.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed!")
