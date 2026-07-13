with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Salas button has wrong ID
content = content.replace(
    'id="btnFiltrarFinanceiro">Filtrar</button>',
    'id="btnFiltrarSalas">Filtrar</button>'
)

# Fix 2: Add ID to Financeiro Filtrar button (between search-financeiro field and btnNovaTransacao)
old_fin = '<div class="search-field">\n            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>\n            <input type="text" id="searchFinanceiro" placeholder="Buscar transa\u00e7\u00e3o">\n          </div>\n          <button class="btn ghost">Filtrar</button>'
new_fin = '<div class="search-field">\n            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>\n            <input type="text" id="searchFinanceiro" placeholder="Buscar transa\u00e7\u00e3o">\n          </div>\n          <button class="btn ghost" id="btnFiltrarFinanceiro">Filtrar</button>'
count = content.count(old_fin)
print(f'Financeiro filter match: {count}')
if count > 0:
    content = content.replace(old_fin, new_fin)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
