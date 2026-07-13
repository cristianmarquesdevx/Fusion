with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add id to Finalizar cobranca button
old = '<button class="btn" style="width:100%; margin-top:16px;">Finalizar cobrança</button>'
new = '<button class="btn" id="btnFinalizarCobranca" style="width:100%; margin-top:16px;">Finalizar cobrança</button>'
count1 = content.count(old)
print('Found Finalizar cobranca: ' + str(count1))
content = content.replace(old, new)

# Add id to Salvar e continuar depois button
old2 = '<button class="btn ghost" style="width:100%; margin-top:10px;">Salvar e continuar depois</button>'
new2 = '<button class="btn ghost" id="btnSalvarCarrinho" style="width:100%; margin-top:10px;">Salvar e continuar depois</button>'
count2 = content.count(old2)
print('Found Salvar: ' + str(count2))
content = content.replace(old2, new2)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
