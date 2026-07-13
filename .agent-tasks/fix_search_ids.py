with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: remove duplicate id from prontuario search
content = content.replace(
    'id="prontSearchInput" id="searchFidelidade"',
    'id="prontSearchInput"'
)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed!')
