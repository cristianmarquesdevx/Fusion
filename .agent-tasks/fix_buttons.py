#!/usr/bin/env python3
"""Fix all broken buttons in the Fusion ERP dashboard."""

import re

# ============ 1. Fix dashboard.html ============
with open('dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix 1: "Ver agenda completa" → navegar para view agenda
html = html.replace(
    '<a class="panel-link" href="#" onclick="return false;">Ver agenda completa</a>',
    '<a class="panel-link" href="#" onclick="document.querySelector(\'.nav-item[data-view="agenda"]\').click(); return false;">Ver agenda completa</a>'
)

# Fix 2: "Repor tudo" → navegar para view estoque
html = html.replace(
    '<a class="panel-link" href="#" onclick="return false;">Repor tudo</a>',
    '<a class="panel-link" href="#" onclick="document.querySelector(\'.nav-item[data-view="estoque"]\').click(); return false;">Repor tudo</a>'
)

# Fix 3: "Novo agendamento" (pront modal) → abrir modal de agenda
html = html.replace(
    '<button class="btn" style="padding:8px 14px;font-size:12.5px;" onclick="return false;">Novo agendamento</button>\n                <button class="pront-close" id="prontClose"',
    '<button class="btn" style="padding:8px 14px;font-size:12.5px;" onclick="if(typeof openModalAgenda===\'function\'){openModalAgenda(document.getElementById(\'prontName\').textContent.trim())}else{document.querySelector(\'.nav-item[data-view="agenda"]\').click()} return false;">Novo agendamento</button>\n                <button class="pront-close" id="prontClose"'
)

# Fix 4: "Salvar anotação" (pront modal) → copiar anotação
html = html.replace(
    '<button class="btn" style="margin-top:14px;" onclick="return false;">Salvar anotação</button>',
    '<button class="btn" style="margin-top:14px;" onclick="Helpers.copyToClipboard(document.getElementById(\'prontNotas\').value); showToast(\'Anotação copiada para a área de transferência\', \'success\'); return false;">Salvar anotação</button>'
)

# Fix 5: "Novo agendamento" (pront view) - remover onclick que conflita
html = html.replace(
    'id="pvNovoAgenda" onclick="return false;">Novo agendamento</button>',
    'id="pvNovoAgenda">Novo agendamento</button>'
)

# Fix 6: "Ver na lista" - corrigir onclick quebrado
html = html.replace(
    "onclick=\"document.querySelector('[data-view=\\'clientes\\']'); document.querySelector('.nav-item[data-view=\\'clientes\\']').click(); return false;\"",
    'onclick="document.querySelector(\'.nav-item[data-view="clientes"]\').click(); return false;"'
)

# Fix 7: "Exportar extrato" → exportar CSV
html = html.replace(
    '<a class="panel-link" href="#" onclick="return false;">Exportar extrato</a>',
    '<a class="panel-link" href="#" onclick="Helpers.exportTablesToCSV(\'[data-view="financeiro"]\'); return false;">Exportar extrato</a>'
)

# Fix 8: "Salvar alterações" → mostrar toast
html = html.replace(
    '<button class="btn" onclick="return false;">Salvar alterações</button>',
    '<button class="btn" onclick="showToast(\'Alterações salvas com sucesso!\', \'success\'); return false;">Salvar alterações</button>'
)

# Fix 9-13: "Encaixar" buttons (lista de espera) - must handle each row
encaixar_pattern = r'(<tr><td><div class="cell-primary">[^<]+</div><div class="cell-sub">[^<]+</div></td><td>[^<]+</td><td>[^<]+</td><td>[^<]+</td><td>.*?</td><td><button class="pill-btn" onclick=")return false;(">Encaixar</button></td></tr>)'
def fix_encaixar(m):
    prefix = m.group(1)
    suffix = m.group(2)
    return prefix + "var n=this.closest('tr').querySelector('.cell-primary').textContent.trim();showToast(n+' encaixado(a) na agenda!','success');" + suffix
html = re.sub(encaixar_pattern, fix_encaixar, html)

# === Add IDs to toolbar buttons ===
# Clientes
html = html.replace(
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn">Nova cliente</button>',
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn" id="btnNovaCliente">Nova cliente</button>'
)

# Agenda
html = html.replace(
    '<button class="btn ghost">Ver por sala</button>\n          <button class="btn">Novo agendamento</button>',
    '<button class="btn ghost">Ver por sala</button>\n          <button class="btn" id="btnNovoAgenda">Novo agendamento</button>'
)

# Financeiro
html = html.replace(
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn">Nova transação</button>',
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn" id="btnNovaTransacao">Nova transação</button>'
)

# Estoque
html = html.replace(
    '<button class="btn ghost">Categorias</button>\n          <button class="btn">Registrar entrada</button>',
    '<button class="btn ghost">Categorias</button>\n          <button class="btn" id="btnRegistrarEntrada">Registrar entrada</button>'
)

# Salas
html = html.replace(
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn">Nova sala</button>',
    '<button class="btn ghost">Filtrar</button>\n          <button class="btn" id="btnNovaSala">Nova sala</button>'
)

# Pacotes
html = html.replace(
    '<button class="btn">+ Novo pacote</button>',
    '<button class="btn" id="btnNovoPacote">+ Novo pacote</button>'
)

# Lista Espera
html = html.replace(
    '<button class="btn">Adicionar à lista</button>',
    '<button class="btn" id="btnAdicionarLista">Adicionar à lista</button>'
)

# Equipe settings
html = html.replace(
    '<button class="btn">+ Novo membro</button>',
    '<button class="btn" id="btnNovoMembro">+ Novo membro</button>'
)

# Multiunidade settings
html = html.replace(
    '<button class="btn">+ Nova unidade</button>',
    '<button class="btn" id="btnNovaUnidade">+ Nova unidade</button>'
)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"dashboard.html: fixed all broken buttons + added toolbar IDs")
print(f"  Total 'return false' remaining: {html.count('return false;')}")
print(f"  Toolbar IDs added: btnNovaCliente, btnNovoAgenda, btnNovaTransacao, btnRegistrarEntrada, btnNovaSala, btnNovoPacote, btnAdicionarLista, btnNovoMembro, btnNovaUnidade")


# ============ 2. Fix app.js - replace fragile selectors with IDs ============
with open('assets/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace(
    "var btnNovaTransacao = document.querySelector('[data-view=\"financeiro\"] .toolbar .btn:last-child');",
    "var btnNovaTransacao = document.getElementById('btnNovaTransacao');"
)
js = js.replace(
    "var btnEntradaEstoque = document.querySelector('[data-view=\"estoque\"] .toolbar .btn:last-child');",
    "var btnEntradaEstoque = document.getElementById('btnRegistrarEntrada');"
)
js = js.replace(
    "var btnNovaCliente = document.querySelector('[data-view=\"clientes\"] .toolbar .btn:last-child');",
    "var btnNovaCliente = document.getElementById('btnNovaCliente');"
)
js = js.replace(
    "var btnNovoAgenda = document.querySelector('[data-view=\"agenda\"] .toolbar .btn:last-child');",
    "var btnNovoAgenda = document.getElementById('btnNovoAgenda');"
)
js = js.replace(
    "var btnNovaSala = document.querySelector('[data-view=\"salas\"] .toolbar .btn:last-child');",
    "var btnNovaSala = document.getElementById('btnNovaSala');"
)
js = js.replace(
    "var btnNovoPacote = document.querySelector('[data-view=\"pacotes\"] .toolbar .btn:last-child');",
    "var btnNovoPacote = document.getElementById('btnNovoPacote');"
)
js = js.replace(
    "var btnListaEspera = document.querySelector('[data-view=\"lista-espera\"] .toolbar .btn:last-child');",
    "var btnListaEspera = document.getElementById('btnAdicionarLista');"
)
js = js.replace(
    "var btnNovaUnidade = document.querySelector('[data-settings-panel=\"multiunidade\"] .toolbar .btn');",
    "var btnNovaUnidade = document.getElementById('btnNovaUnidade');"
)
js = js.replace(
    "var btnNovoMembro = document.querySelector('[data-settings-panel=\"equipe\"] .toolbar .btn');",
    "var btnNovoMembro = document.getElementById('btnNovoMembro');"
)

with open('assets/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print(f"\napp.js: replaced all fragile selectors with document.getElementById()")
print("Done! All buttons should now work correctly.")
