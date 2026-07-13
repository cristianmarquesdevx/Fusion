#!/usr/bin/env python3
"""Update dashboard.html with Supabase and fila-atendimento script tags."""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Supabase CDN after main.css in <head>
cdn_script = '<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n'
head_insert = '<link rel="stylesheet" href="assets/css/main.css">\n'
if cdn_script not in html:
    html = html.replace(head_insert, head_insert + cdn_script, 1)

# 2. Add supabase.js after storage.js
sb_script = '        <script src="assets/services/supabase.js"></script>\n'
storage_line = '        <script src="assets/services/storage.js"></script>\n'
if sb_script not in html:
    html = html.replace(storage_line, storage_line + sb_script, 1)

# 3. Add fila-atendimento.js after pdv.js
fa_script = '        <script src="assets/js/views/fila-atendimento.js"></script>\n'
pdv_line = '        <script src="assets/js/views/pdv.js"></script>\n'
if fa_script not in html:
    html = html.replace(pdv_line, pdv_line + fa_script, 1)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("OK: dashboard.html updated")
