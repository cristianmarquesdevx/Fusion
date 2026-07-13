with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add counter after btnFiltrarClientes
old = '<button class="btn ghost" id="btnFiltrarClientes">Filtrar</button>'
new = '<button class="btn ghost" id="btnFiltrarClientes">Filtrar</button>\n          <span class="result-counter" id="counterClientes"></span>'
count = content.count(old)
print(f"Clientes: found {count}")
content = content.replace(old, new, 1)

# Add counter after btnFiltrarFinanceiro
old = '<button class="btn ghost" id="btnFiltrarFinanceiro">Filtrar</button>'
new = '<button class="btn ghost" id="btnFiltrarFinanceiro">Filtrar</button>\n          <span class="result-counter" id="counterFinanceiro"></span>'
count = content.count(old)
print(f"Financeiro: found {count}")
content = content.replace(old, new, 1)

# Add counter after btnFiltrarEstoque (currently text is "Categorias")
old = '<button class="btn ghost" id="btnFiltrarEstoque">Categorias</button>'
new = '<button class="btn ghost" id="btnFiltrarEstoque">Categorias</button>\n          <span class="result-counter" id="counterEstoque"></span>'
count = content.count(old)
print(f"Estoque: found {count}")
content = content.replace(old, new, 1)

# Add counter after btnFiltrarSalas
old = '<button class="btn ghost" id="btnFiltrarSalas">Filtrar</button>'
new = '<button class="btn ghost" id="btnFiltrarSalas">Filtrar</button>\n          <span class="result-counter" id="counterSalas"></span>'
count = content.count(old)
print(f"Salas: found {count}")
content = content.replace(old, new, 1)

# Add counter after btnFiltrarFidelidade
old = '<button class="btn ghost" id="btnFiltrarFidelidade">Filtrar nível</button>'
new = '<button class="btn ghost" id="btnFiltrarFidelidade">Filtrar nível</button>\n          <span class="result-counter" id="counterFidelidade"></span>'
count = content.count(old)
print(f"Fidelidade: found {count}")
content = content.replace(old, new, 1)

# Add counter after searchPdv (PDV has no Filtrar button, add after the search input area)
old = '<input type="text" id="searchPdv" placeholder="Buscar produto ou serviço">\n              </div>\n            </div>'
new = '<input type="text" id="searchPdv" placeholder="Buscar produto ou serviço">\n              </div>\n              <span class="result-counter" id="counterPdv"></span>\n            </div>'
count = content.count(old)
print(f"PDV: found {count}")
content = content.replace(old, new, 1)

# Add counter after searchEquipe
old = '<input type="text" id="searchEquipe" placeholder="Buscar membro">\n                </div>\n                <button class="btn" id="btnNovoMembro">+ Novo membro</button>'
new = '<input type="text" id="searchEquipe" placeholder="Buscar membro">\n                </div>\n                <span class="result-counter" id="counterEquipe"></span>\n                <button class="btn" id="btnNovoMembro">+ Novo membro</button>'
count = content.count(old)
print(f"Equipe: found {count}")
content = content.replace(old, new, 1)

# Add counter after searchListaEspera
old = '<input type="text" id="searchListaEspera" placeholder="Buscar na lista">'
# Add counter after the parent div of search field
old_div = '<div class=\"search-field\" style=\"max-width:240px;\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M21 21l-4.3-4.3\"/></svg><input type=\"text\" id=\"searchListaEspera\" placeholder=\"Buscar na lista\"></div>'
new_div = '<div class=\"search-field\" style=\"max-width:240px;\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"M21 21l-4.3-4.3\"/></svg><input type=\"text\" id=\"searchListaEspera\" placeholder=\"Buscar na lista\"></div>\n          <span class=\"result-counter\" id=\"counterListaEspera\"></span>'
count = content.count(old_div)
print(f"Lista Espera: found {count}")
content = content.replace(old_div, new_div, 1)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDone! Verifying counter IDs...")
counts = content.count('result-counter')
print(f"Total result-counter elements: {counts}")
