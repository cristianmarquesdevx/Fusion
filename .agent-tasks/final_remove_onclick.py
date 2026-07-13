import re

with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Theme buttons - add IDs, remove onclick
content = content.replace(
    '<button class="btn" onclick="document.getElementById(\'themeToggle\').click();return false;">Alternar para tema escuro</button>',
    '<button class="btn" id="btnTemaEscuro">Alternar para tema escuro</button>'
)
content = content.replace(
    '<button class="btn ghost" onclick="document.getElementById(\'themeToggle\').click();return false;">Alternar para tema claro</button>',
    '<button class="btn ghost" id="btnTemaClaro">Alternar para tema claro</button>'
)

# 2. biExportCSV - already has ID, just remove onclick
content = content.replace(
    '<button class="btn ghost" id="biExportCSV" onclick="Helpers.exportToCSV([],\'bi.csv\');return false;">Exportar dados</button>',
    '<button class="btn ghost" id="biExportCSV">Exportar dados</button>'
)

# 3. Cancel buttons in modals - add class modal-close-btn, remove onclick
def replace_cancel_onclick(match):
    full = match.group(0)
    # Remove the onclick attribute
    # Pattern: onclick="document.getElementById('XXX').classList.remove('open');return false;"
    new = re.sub(
        r'\s+onclick="document\.getElementById\(\'[^\']+\'\)\.classList\.remove\(\'open\'\);return false;"',
        '',
        full
    )
    # Add class modal-close-btn if not already present
    if 'modal-close-btn' not in new:
        new = new.replace('class="btn ghost"', 'class="btn ghost modal-close-btn"')
    return new

content = re.sub(
    r'<button type="button" class="btn ghost"[^>]*onclick="document\.getElementById\(\'[^\']+\'\)\.classList\.remove\(\'open\'\);return false;">Cancelar</button>',
    replace_cancel_onclick,
    content
)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Remaining onclick occurrences:")
import subprocess
result = subprocess.run(['findstr', 'onclick=', 'dashboard.html'], capture_output=True, text=True, shell=True)
print(result.stdout or "None found!")
