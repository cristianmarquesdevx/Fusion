#!/usr/bin/env python3
"""Replace static timeline and rooms grid with dynamic containers in dashboard.html"""
import re

with open('dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# --- Replace fila-atendimento timeline ---
# Find the section
fa_marker = '<!-- ============ FILA DE ATENDIMENTO ============ -->'
fa_pos = html.find(fa_marker)
if fa_pos == -1:
    raise Exception('Fila section not found')

# Find the timeline div within this section
tl_marker = '<div class="timeline">'
tl_pos = html.find(tl_marker, fa_pos)
if tl_pos == -1:
    raise Exception('Timeline not found in fila section')

# Find end of the timeline (static rows) - look for the pattern that follows the last tl-row
# The timeline ends with </div> (closing .timeline), followed by whitespace and </div> (closing .panel-body)
timeline_close = html.find('\n              </div>\n            </div>\n          </div>\n        </div>\n      </section>\n\n      <!-- ============ GESTÃO DE SALAS', tl_pos)
if timeline_close == -1:
    raise Exception('Timeline end boundary not found')

# Replace just the content between <div class="timeline"> and its closing </div>
new_timeline = '<div class="timeline" id="filaTimeline">\n                <!-- Renderizado dinamicamente por assets/js/views/fila-atendimento.js -->\n              </div>'

html = html[:tl_pos] + new_timeline + html[timeline_close:]

# --- Replace salas report-grid ---
salas_marker = '<!-- ============ GESTÃO DE SALAS ============ -->'
salas_pos = html.find(salas_marker)
if salas_pos == -1:
    raise Exception('Salas section not found')

# Find report-grid
grid_marker = '<div class="report-grid">'
grid_pos = html.find(grid_marker, salas_pos)
if grid_pos == -1:
    raise Exception('Report grid not found in salas section')

# Find end of report grid - look for close div followed by section close
grid_end_marker = '\n        </div>\n      </section>\n\n      <!-- ============ PACOTES'
grid_end = html.find(grid_end_marker, grid_pos)
if grid_end == -1:
    raise Exception('Grid end boundary not found')

new_grid = '<div class="report-grid" id="roomsGrid">\n          <!-- Renderizado dinamicamente por assets/js/views/salas.js -->\n        </div>'

html = html[:grid_pos] + new_grid + html[grid_end:]

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('dashboard.html updated successfully')
print(f'Fila timeline replaced at position {tl_pos}')
print(f'Salas grid replaced at position {grid_pos}')
