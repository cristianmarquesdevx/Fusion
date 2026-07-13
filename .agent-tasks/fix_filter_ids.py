with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Salas - the search field has a distinct inline style
old_salas = '<div class="search-field" style="max-width:240px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="text" id="searchSalas" placeholder="Buscar sala"></div>\n          <button class="btn ghost">Filtrar</button>'
new_salas = '<div class="search-field" style="max-width:240px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="text" id="searchSalas" placeholder="Buscar sala"></div>\n          <button class="btn ghost" id="btnFiltrarSalas">Filtrar</button>'
count = content.count(old_salas)
print(f'Salas filter: {count}')
if count > 0:
    content = content.replace(old_salas, new_salas)
    print('Replaced!')

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
