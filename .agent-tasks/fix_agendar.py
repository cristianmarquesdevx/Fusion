import re

with open('agendar.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inline onclick buttons with ID'd buttons
replacements = [
    # Step 1 - Continuar
    ('<button class="btn btn-primary" onclick="nextStep(2)">Continuar</button>',
     '<button class="btn btn-primary" id="btnStep1Avancar">Continuar</button>'),
    # Step 2 - Voltar
    ('<button class="btn btn-ghost" onclick="prevStep(1)">Voltar</button>',
     '<button class="btn btn-ghost" id="btnStep2Voltar">Voltar</button>'),
    # Step 2 - Continuar
    ('<button class="btn btn-primary" onclick="nextStep(3)">Continuar</button>',
     '<button class="btn btn-primary" id="btnStep2Avancar">Continuar</button>'),
    # Step 3 - Voltar
    ('<button class="btn btn-ghost" onclick="prevStep(2)">Voltar</button>',
     '<button class="btn btn-ghost" id="btnStep3Voltar">Voltar</button>'),
    # Step 3 - Revisar
    ('<button class="btn btn-primary" onclick="nextStep(4)">Revisar</button>',
     '<button class="btn btn-primary" id="btnStep3Avancar">Revisar</button>'),
    # Step 4 - Voltar
    ('<button class="btn btn-ghost" onclick="prevStep(3)">Voltar</button>',
     '<button class="btn btn-ghost" id="btnStep4Voltar">Voltar</button>'),
    # Step 4 - Confirmar
    ('<button class="btn btn-primary" onclick="confirmarAgendamento()">Confirmar agendamento</button>',
     '<button class="btn btn-primary" id="btnConfirmarAgendamento">Confirmar agendamento</button>'),
    # Success - Novo agendamento
    ('<button class="btn btn-primary" style="margin-top:24px;" onclick="location.reload()">Novo agendamento</button>',
     '<button class="btn btn-primary" id="btnNovoAgendamento" style="margin-top:24px;">Novo agendamento</button>'),
]

for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        print(f"Replaced: {old[:50]}... (found {count})")
    else:
        print(f"NOT FOUND: {old[:50]}...")

# Remove the inline <script> block and replace with external script reference
# The script block starts with:  <script>\\n  var currentStep = 1;
script_start = '<script>\n  var currentStep = 1;'
script_end = '</script>'

# Find the script block
idx_start = content.find(script_start)
if idx_start >= 0:
    idx_end = content.find(script_end, idx_start)
    if idx_end >= 0:
        idx_end += len(script_end)
        # Remove the inline script and add external reference
        new_script = '<script src="assets/js/agendar-app.js"></script>'
        content = content[:idx_start] + new_script + content[idx_end:]
        print(f"Replaced inline script with external reference at position {idx_start}")
    else:
        print("Could not find end of script tag")
else:
    print("Could not find start of inline script")

with open('agendar.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nDone! Verifying no onclick remains...")
import subprocess
result = subprocess.run(['findstr', 'onclick=', 'agendar.html'], capture_output=True, text=True, shell=True)
print(result.stdout or "None found!")
