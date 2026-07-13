with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Clientes
    ('placeholder="Buscar por nome, telefone ou CPF"',
     'id="searchClientes" placeholder="Buscar por nome, telefone ou CPF"'),
    # Financeiro
    ('placeholder="Buscar transação"',
     'id="searchFinanceiro" placeholder="Buscar transação"'),
    # Estoque
    ('placeholder="Buscar item ou lote"',
     'id="searchEstoque" placeholder="Buscar item ou lote"'),
    # PDV
    ('<input type="text" placeholder="Buscar produto ou serviço">',
     '<input type="text" id="searchPdv" placeholder="Buscar produto ou serviço">'),
    # Equipe (Configurações)
    ('placeholder="Buscar membro"',
     'id="searchEquipe" placeholder="Buscar membro"'),
    # Salas
    ('placeholder="Buscar sala"',
     'id="searchSalas" placeholder="Buscar sala"'),
    # Fidelidade
    ('placeholder="Buscar cliente…"',
     'id="searchFidelidade" placeholder="Buscar cliente…"'),
    # Lista de Espera
    ('placeholder="Buscar na lista"',
     'id="searchListaEspera" placeholder="Buscar na lista"'),
]

for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f'OK: {old[:40]}... (found {count})')
    else:
        print(f'MISS: {old[:40]}... (not found!)')

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nDone!')
