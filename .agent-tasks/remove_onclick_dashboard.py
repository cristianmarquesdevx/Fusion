import re

with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = []

# 1. Ver agenda completa (line 213)
replacements.append((
    'onclick="document.querySelector(\'.nav-item[data-view=\"agenda\"]\').click(); return false;"',
    'id="linkVerAgenda"'
))

# 2. Repor tudo (line 301)
replacements.append((
    'onclick="document.querySelector(\'.nav-item[data-view=\"estoque\"]\').click(); return false;"',
    'id="linkReporEstoque"'
))

# 3. Novo agendamento (pront modal, line 442)
replacements.append((
    'onclick="if(typeof openModalAgenda===\'function\'){openModalAgenda(document.getElementById(\'prontName\').textContent.trim())}else{document.querySelector(\'.nav-item[data-view=\"agenda\"]\').click()} return false;"',
    'id="btnProntNovoAgenda"'
))

# 4. Salvar anotacao (pront modal, line 522)
replacements.append((
    'onclick="Helpers.copyToClipboard(document.getElementById(\'prontNotas\').value); showToast(\'Anota\u00e7\u00e3o copiada para a \u00e1rea de transfer\u00eancia\', \'success\'); return false;"',
    'id="btnProntSalvarAnotacao"'
))

# 5. Ver na lista (pront view, line 571)
replacements.append((
    'onclick="document.querySelector(\'.nav-item[data-view=\"clientes\"]\').click(); return false;"',
    'id="linkVerNaLista"'
))

# 6. Copiar anotacao (pront view, line 646)
replacements.append((
    'onclick="Helpers.copyToClipboard(document.getElementById(\'pvNotas\').value);showToast(\'Anota\u00e7\u00e3o copiada para a \u00e1rea de transfer\u00eancia\', \'success\');return false;"',
    'id="btnPvCopiarAnotacao"'
))

# 7. Exportar extrato (financeiro, line 756)
replacements.append((
    'onclick="Helpers.exportTablesToCSV(\'[data-view=\"financeiro\"]\'); return false;"',
    'id="linkExportarExtrato"'
))

# 8. Salvar alteracoes (config, line 1072)
replacements.append((
    'onclick="showToast(\'Altera\u00e7\u00f5es salvas com sucesso!\', \'success\'); return false;"',
    'id="btnSalvarConfigUnidade"'
))

# 9. Alternar para tema escuro (line 1198)
replacements.append((
    'onclick="document.getElementById(\'themeToggle\').click();return false;"',
    'id="btnTemaEscuro"'
))

# 10. Alternar para tema claro (line 1199) - NOTE: this is inside the Aparência panel
# We need to be specific about which one
replacements.append((
    'onclick="document.getElementById(\'themeToggle\').click();return false;"',
    'id="btnTemaClaro"'
))

# 11-15. Encaixar buttons (lines 1527-1531) - We'll use event delegation, remove onclick
encaixar_pattern = r'onclick="var n=this\.closest\(\'tr\'\)\.querySelector\(\'\.cell-primary\'\)\.textContent\.trim\(\);showToast\(n\+\' encaixado\(a\) na agenda!\',\'success\'\);"'
encaixar_replacement = 'class="pill-btn encaixar-btn"'
content = re.sub(encaixar_pattern, encaixar_replacement, content)

print(f"Removed {len(re.findall(encaixar_pattern, content))} Encaixar onclick(s) remaining")

# Now apply the named replacements
# But btnTemaEscuro and btnTemaClaro need special handling since they have the same onclick
# Let me use context-based replacement for the theme buttons
# First replace btnTemaEscuro (1st occurrence)
idx = content.find('onclick="document.getElementById(\'themeToggle\').click();return false;"')
if idx > 0:
    # Replace this specific occurrence
    before = content[idx-60:idx]
    if 'tema escuro' in before:
        # This is the escuro button
        old = content[idx:idx+len('onclick="document.getElementById(\'themeToggle\').click();return false;"')]
        content = content[:idx] + 'id="btnTemaEscuro"' + content[idx+len(old):]
        print("Replaced btnTemaEscuro")

# Now find the 2nd occurrence for btnTemaClaro
idx2 = content.find('onclick="document.getElementById(\'themeToggle\').click();return false;"')
if idx2 > 0:
    before2 = content[idx2-60:idx2]
    if 'tema claro' in before2:
        old2 = content[idx2:idx2+len('onclick="document.getElementById(\'themeToggle\').click();return false;"')]
        content = content[:idx2] + 'id="btnTemaClaro"' + content[idx2+len(old2):]
        print("Replaced btnTemaClaro")

# Now handle the remaining named replacements
for old, new in replacements:
    # Skip theme buttons (already handled)
    if 'themeToggle' in old:
        continue
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f'OK: {old[:40]}... ({count})')
    else:
        print(f'MISS: {old[:40]}...')

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nDashboard onclick removals complete!')
