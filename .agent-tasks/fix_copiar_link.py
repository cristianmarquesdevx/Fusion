with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

old = '<button class="btn ghost" style="font-size:11px;padding:5px 10px;">Copiar link</button>'
new = '<button class="btn ghost" id="btnCopiarLink" style="font-size:11px;padding:5px 10px;">Copiar link</button>'
count = content.count(old)
print('Found: ' + str(count))
content = content.replace(old, new)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
