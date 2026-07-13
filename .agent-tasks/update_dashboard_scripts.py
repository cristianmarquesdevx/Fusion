import re

with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_scripts = '''          <script src="assets/utils/constants.js"></script>
          <script src="assets/utils/helpers.js"></script>
          <script src="assets/utils/validators.js"></script>
          <script src="config/app-config.js"></script>
          <script src="assets/services/storage.js"></script>
          <script src="assets/js/store.js"></script>
          <script src="assets/js/app.js"></script>'''

new_scripts = '''          <script src="assets/utils/constants.js"></script>
          <script src="assets/utils/helpers.js"></script>
          <script src="assets/utils/validators.js"></script>
          <script src="config/app-config.js"></script>
          <script src="assets/services/storage.js"></script>
          <script src="assets/js/store.js"></script>
          <script src="assets/js/modules/store-init.js"></script>
          <script src="assets/js/app.js"></script>
          <script src="assets/js/views/clientes.js"></script>
          <script src="assets/js/views/prontuario.js"></script>
          <script src="assets/js/views/agenda.js"></script>
          <script src="assets/js/views/financeiro.js"></script>
          <script src="assets/js/views/estoque.js"></script>
          <script src="assets/js/views/salas.js"></script>
          <script src="assets/js/views/pacotes.js"></script>
          <script src="assets/js/views/lista-espera.js"></script>
          <script src="assets/js/views/fidelidade.js"></script>
          <script src="assets/js/views/planos.js"></script>
          <script src="assets/js/views/configuracoes.js"></script>'''

count = content.count(old_scripts)
print(f"Found {count} occurrences of old script block")

if count > 0:
    content = content.replace(old_scripts, new_scripts)
    with open('dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated dashboard.html!")
else:
    # Try alternative: find the </body> tag and insert before it
    print("Trying alternative approach...")
    body_close = content.rfind('</body>')
    if body_close > 0:
        # Find the last script tag before </body>
        last_script_end = content.rfind('</script>', 0, body_close)
        if last_script_end > 0:
            insertion_point = last_script_end + len('</script>')
            new_scripts_block = '''
          <script src="assets/js/modules/store-init.js"></script>
          <script src="assets/js/views/clientes.js"></script>
          <script src="assets/js/views/prontuario.js"></script>
          <script src="assets/js/views/agenda.js"></script>
          <script src="assets/js/views/financeiro.js"></script>
          <script src="assets/js/views/estoque.js"></script>
          <script src="assets/js/views/salas.js"></script>
          <script src="assets/js/views/pacotes.js"></script>
          <script src="assets/js/views/lista-espera.js"></script>
          <script src="assets/js/views/fidelidade.js"></script>
          <script src="assets/js/views/planos.js"></script>
          <script src="assets/js/views/configuracoes.js"></script>'''
            content = content[:insertion_point] + new_scripts_block + content[insertion_point:]
            with open('dashboard.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print("Successfully updated dashboard.html via alternative approach!")
        else:
            print("Could not find script tags!")
    else:
        print("Could not find </body> tag!")
