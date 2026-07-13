with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add pdv.js script tag after configs.js and before </body>
old = '          <script src="assets/js/views/configuracoes.js"></script>'
new = '          <script src="assets/js/views/configuracoes.js"></script>\n          <script src="assets/js/views/pdv.js"></script>'
count = content.count(old)
print('Found configs.js: ' + str(count))
content = content.replace(old, new)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Added pdv.js script tag!')
