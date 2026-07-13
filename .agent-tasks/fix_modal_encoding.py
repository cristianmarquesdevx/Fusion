#!/usr/bin/env python3
"""Fix broken encoding in modals of dashboard.html."""

import os

# The working directory is already the project root from bash

with open('dashboard.html', 'rb') as f:
    data = f.read()

# Replace specific broken byte sequences with correct UTF-8 Portuguese text
# The broken characters appear as U+FFFD (replacement char) in the modals

replacements = [
    # Modal: Adicionar Pontos (Fidelidade)
    (b'Selecione\xef\xbf\xbd\xef\xbf\xbd', b'Selecione...'),
    (b'Patr\xef\xbf\xbdcia Nogueira', 'Patrícia Nogueira'.encode('utf-8')),
    (b'Indica\xef\xbf\xbd\xef\xbf\xbdo de cliente', 'Indicação de cliente'.encode('utf-8')),
    (b'Anivers\xef\xbf\xbdrio', 'Aniversário'.encode('utf-8')),
    (b'B\xef\xbf\xbdnus promocional', 'Bônus promocional'.encode('utf-8')),
    (b'Observa\xef\xbf\xbd\xef\xbf\xbdes', 'Observações'.encode('utf-8')),
    (b'Observa\xef\xbf\xbd\xef\xbf\xbdes sobre a pontua\xef\xbf\xbd\xef\xbf\xbdo\xef\xbf\xbd\xef\xbf\xbd', 'Observações sobre a pontuação...'.encode('utf-8')),
    # Fix partial sequences too (multi-pass)
    (b'pontua\xef\xbf\xbd\xef\xbf\xbdo', 'pontuação'.encode('utf-8')),
    
    # Modal: Novo Plano Recorrente
    (b'Sess\xef\xbf\xbdes inclusas', 'Sessões inclusas'.encode('utf-8')),
    (b'Descri\xef\xbf\xbd\xef\xbf\xbdo dos benef\xef\xbf\xbdcios', 'Descrição dos benefícios'.encode('utf-8')),
    (b'Descreva os benef\xef\xbf\xbdcios do plano\xef\xbf\xbd\xef\xbf\xbd', 'Descreva os benefícios do plano...'.encode('utf-8')),
    
    # Modal: Nova Unidade
    (b'Vila Ol\xef\xbf\xbdmpia', 'Vila Olímpia'.encode('utf-8')),
    (b'Endere\xef\xbf\xbd\xef\xbf\xbdo', 'Endereço'.encode('utf-8')),
    (b'Informa\xef\xbf\xbd\xe2\x82\xac\xef\xbf\xbdes adicionais\xef\xbf\xbd\xef\xbf\xbd', 'Informações adicionais...'.encode('utf-8')),
    (b'Informa\xef\xbf\xbd\xef\xbf\xbdes', 'Informações'.encode('utf-8')),
    
    # Modal: Novo Membro (Equipe)
    (b'M\xef\xbf\xbddica(o)', 'Médica(o)'.encode('utf-8')),
]

count = 0
for old, new in replacements:
    if old in data:
        data = data.replace(old, new)
        count += 1
        print(f"  Replaced: {old[:30]}... -> {new[:30]}...")
    else:
        # Try to search for partial matches
        print(f"  NOT FOUND: {old[:40]}")

# Also do a general clean-up: replace any remaining standalone U+FFFD with proper guesses
# First, let's count remaining
remaining = data.count(b'\xef\xbf\xbd')
print(f"\nRemaining U+FFFD characters: {remaining}")

with open('dashboard.html', 'wb') as f:
    f.write(data)

print(f"\nApplied {count} replacements. Remaining broken chars: {remaining}")
print("Done!")
