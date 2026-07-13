with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Clientes - Fltrar button
    ('<button class="btn ghost">Filtrar</button>',
     '<button class="btn ghost" id="btnFiltrarClientes">Filtrar</button>',
     1),  # 1st occurrence
    # Financeiro - Fltrar button  
    ('<button class="btn ghost">Filtrar</button>',
     '<button class="btn ghost" id="btnFiltrarFinanceiro">Filtrar</button>',
     2),  # 2nd occurrence
    # Salas - Fltrar button
    ('<button class="btn ghost">Filtrar</button>',
     '<button class="btn ghost" id="btnFiltrarSalas">Filtrar</button>',
     3),  # 3rd occurrence
    # Fidelidade - Fltrar nvel button
    ('<button class="btn ghost">Filtrar n\u00edvel</button>',
     '<button class="btn ghost" id="btnFiltrarFidelidade">Filtrar n\u00edvel</button>',
     1),
    # Estoque - Categorias button (acts as filter)
    ('<button class="btn ghost">Categorias</button>',
     '<button class="btn ghost" id="btnFiltrarEstoque">Categorias</button>',
     1),
]

for old, new, nth in replacements:
    count = content.count(old)
    if count >= nth:
        # Replace nth occurrence
        idx = -1
        for i in range(nth):
            idx = content.find(old, idx + 1)
        content = content[:idx] + new + content[idx + len(old):]
        print(f'OK: {old[:35]}... (#{nth})')
    else:
        print(f'MISS: {old[:35]}... (only {count} found, need #{nth})')

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
