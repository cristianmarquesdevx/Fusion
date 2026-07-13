# Use raw string for Windows path
import os
print(f"Working directory: {os.getcwd()}")

# ============================================================
# FIX 1: Encoding quebrado na view Fidelidade (dashboard.html)
# ============================================================
with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace broken characters
content = content.replace('Buscar cliente\ufffd\ufffd', 'Buscar cliente\u2026')
content = content.replace('Filtrar n\ufffdvel', 'Filtrar n\u00edvel')

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("FIX 1: dashboard.html encoding fixed")

# ============================================================
# FIX 2: Dias da semana duplicados (dashboard.html)
# ============================================================
# Find the chart section with duplicate "Ter"
# The sequence should be: Qui, Sex, S\u00e1b, Dom, Seg, Ter, Qua
# Currently ends with Ter, Ter - fix the last one to Qua

old_chart = 'height:80%"></div><span class="day-label">Ter</span>'
new_chart = 'height:80%"></div><span class="day-label">Qua</span>'

# Only replace the LAST occurrence (the second "Ter")
last_pos = content.rfind(old_chart)
if last_pos > 0:
    content = content[:last_pos] + new_chart + content[last_pos + len(old_chart):]
    print("FIX 2: Chart day labels fixed (second Ter -> Qua)")

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

# ============================================================
# FIX 3: Abas do prontu\u00e1rio view (app.js)
# ============================================================
with open('assets/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old = "if (firstPanel) firstPanel.style.display = '';"
new = "if (firstPanel) firstPanel.style.display = 'block';  // block sobrescreve CSS display:none"

if old in js:
    js = js.replace(old, new)
    print("FIX 3: app.js prontuario panel display fixed")
else:
    print("WARNING: Could not find exact pattern in app.js")

with open('assets/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

# ============================================================
# FIX 4: agendar.html - Complete booking page
# ============================================================
agendar_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agende seu hor\u00e1rio \u2014 Centro Vitta</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --brand: #2F4A3E; --gold: #9C7A3E; --bg: #FAFAF8; --surface: #FFFFFF;
    --ink: #1C2620; --ink-soft: #5B6459; --ink-faint: #8A9186; --border: #E3E1D8;
    --sage: #4C7A5E; --rose: #B14E3D;
    --radius: 12px; --shadow: 0 2px 16px rgba(28,38,32,0.07);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--ink); line-height: 1.6; min-height: 100vh; }
  .booking-header { background: linear-gradient(135deg, #1C2620 0%, #0E1710 100%); color: #fff; padding: 48px 24px; text-align: center; }
  .booking-header .glyph { font-family: 'Fraunces', serif; font-size: 48px; font-weight: 700; color: var(--gold); display: block; margin-bottom: 8px; }
  .booking-header h1 { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; margin-bottom: 8px; }
  .booking-header p { font-size: 15px; color: rgba(255,255,255,0.7); max-width: 480px; margin: 0 auto; }
  .booking-container { max-width: 720px; margin: -24px auto 40px; padding: 0 16px; position: relative; z-index: 2; }
  .booking-card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); padding: 32px; margin-bottom: 16px; }
  .steps { display: flex; gap: 8px; margin-bottom: 28px; justify-content: center; }
  .step { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; background: var(--surface); border: 2px solid var(--border); color: var(--ink-faint); }
  .step.active { background: var(--brand); border-color: var(--brand); color: #fff; }
  .step.done { background: var(--sage); border-color: var(--sage); color: #fff; }
  .step-label { font-size: 11px; color: var(--ink-faint); text-align: center; margin-top: 4px; }
  .step-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .form-group { margin-bottom: 18px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; color: var(--ink); }
  .form-group label .required { color: var(--rose); }
  .form-input, .form-select { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; font-family: inherit; color: var(--ink); background: var(--bg); outline: none; transition: border-color .2s; }
  .form-input:focus, .form-select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(47,74,62,0.1); }
  .form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A9186' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 11px center; padding-right: 32px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .btn { font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; transition: background .2s; }
  .btn-primary { background: var(--brand); color: #fff; }
  .btn-primary:hover { background: #233A30; }
  .btn-ghost { background: var(--surface); border: 1.5px solid var(--border); color: var(--ink); }
  .btn-ghost:hover { background: var(--bg); }
  .btn-wrap { display: flex; gap: 12px; justify-content: space-between; margin-top: 24px; }
  .service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .service-card { padding: 16px; border: 1.5px solid var(--border); border-radius: var(--radius); cursor: pointer; transition: all .2s; background: var(--surface); }
  .service-card:hover { border-color: var(--brand); }
  .service-card.selected { border-color: var(--brand); background: var(--brand-soft); box-shadow: 0 0 0 2px rgba(47,74,62,0.15); }
  .service-card .s-name { font-weight: 600; font-size: 14px; }
  .service-card .s-price { font-size: 13px; color: var(--ink-soft); margin-top: 2px; }
  .service-card .s-dur { font-size: 12px; color: var(--ink-faint); margin-top: 1px; }
  .time-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .time-slot { padding: 10px; text-align: center; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13px; cursor: pointer; transition: all .2s; }
  .time-slot:hover { border-color: var(--brand); }
  .time-slot.selected { border-color: var(--brand); background: var(--brand-soft); font-weight: 600; }
  .time-slot.unavailable { opacity: 0.35; cursor: not-allowed; text-decoration: line-through; }
  .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .summary-row:last-child { border-bottom: none; }
  .summary-label { color: var(--ink-soft); }
  .summary-value { font-weight: 600; }
  .success-screen { text-align: center; padding: 40px 20px; }
  .success-screen .check { width: 64px; height: 64px; border-radius: 50%; background: var(--sage); color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
  .success-screen h2 { font-family: 'Fraunces', serif; font-size: 22px; margin-bottom: 8px; }
  .success-screen p { color: var(--ink-soft); max-width: 380px; margin: 0 auto; }
  .step-content { display: none; }
  .step-content.active { display: block; animation: fadein .3s ease; }
  @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } .service-grid { grid-template-columns: 1fr; } .time-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
</head>
<body>

<div class="booking-header">
  <span class="glyph">F</span>
  <h1>Agende seu hor\u00e1rio</h1>
  <p>Centro Vitta \u2014 Unidade Jardins. Escolha o servi\u00e7o, profissional e hor\u00e1rio ideal para voc\u00ea.</p>
</div>

<div class="booking-container">
  <div class="booking-card">

    <!-- Steps indicator -->
    <div class="steps" id="stepIndicator">
      <div class="step-wrap">
        <div class="step active" data-step="1">1</div>
        <div class="step-label">Dados</div>
      </div>
      <div class="step-wrap">
        <div class="step" data-step="2">2</div>
        <div class="step-label">Servi\u00e7o</div>
      </div>
      <div class="step-wrap">
        <div class="step" data-step="3">3</div>
        <div class="step-label">Hor\u00e1rio</div>
      </div>
      <div class="step-wrap">
        <div class="step" data-step="4">4</div>
        <div class="step-label">Confirma\u00e7\u00e3o</div>
      </div>
    </div>

    <!-- STEP 1 -->
    <div class="step-content active" data-step="1">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:18px;">Seus dados</h2>
      <div class="form-group">
        <label>Nome completo <span class="required">*</span></label>
        <input type="text" class="form-input" id="nome" placeholder="Seu nome" autocomplete="name">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Telefone <span class="required">*</span></label>
          <input type="tel" class="form-input" id="tel" placeholder="(11) 99999-8888" autocomplete="tel">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-input" id="email" placeholder="seu@email.com" autocomplete="email">
        </div>
      </div>
      <div class="btn-wrap">
        <div></div>
        <button class="btn btn-primary" onclick="nextStep(2)">Continuar</button>
      </div>
    </div>

    <!-- STEP 2 -->
    <div class="step-content" data-step="2">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:18px;">Escolha o servi\u00e7o</h2>
      <div class="form-group">
        <label>Profissional</label>
        <select class="form-select" id="profissional">
          <option value="dra-camila">Dra. Camila</option>
          <option value="fernanda">Fernanda (esteticista)</option>
          <option value="carlos">Carlos (massoterapeuta)</option>
        </select>
      </div>
      <div class="service-grid" id="serviceGrid">
        <div class="service-card selected" data-servico="Limpeza de pele profunda" data-preco="R$ 180" data-dur="60 min">
          <div class="s-name">Limpeza de pele profunda</div>
          <div class="s-price">R$ 180</div>
          <div class="s-dur">60 min</div>
        </div>
        <div class="service-card" data-servico="Peeling de diamante" data-preco="R$ 250" data-dur="60 min">
          <div class="s-name">Peeling de diamante</div>
          <div class="s-price">R$ 250</div>
          <div class="s-dur">60 min</div>
        </div>
        <div class="service-card" data-servico="Toxina botul\u00ednica" data-preco="R$ 890" data-dur="90 min">
          <div class="s-name">Toxina botul\u00ednica</div>
          <div class="s-price">R$ 890</div>
          <div class="s-dur">90 min</div>
        </div>
        <div class="service-card" data-servico="Drenagem linf\u00e1tica" data-preco="R$ 180" data-dur="50 min">
          <div class="s-name">Drenagem linf\u00e1tica</div>
          <div class="s-price">R$ 180</div>
          <div class="s-dur">50 min</div>
        </div>
        <div class="service-card" data-servico="Massagem relaxante" data-preco="R$ 200" data-dur="60 min">
          <div class="s-name">Massagem relaxante</div>
          <div class="s-price">R$ 200</div>
          <div class="s-dur">60 min</div>
        </div>
        <div class="service-card" data-servico="Microagulhamento" data-preco="R$ 450" data-dur="90 min">
          <div class="s-name">Microagulhamento</div>
          <div class="s-price">R$ 450</div>
          <div class="s-dur">90 min</div>
        </div>
      </div>
      <div class="btn-wrap">
        <button class="btn btn-ghost" onclick="prevStep(1)">Voltar</button>
        <button class="btn btn-primary" onclick="nextStep(3)">Continuar</button>
      </div>
    </div>

    <!-- STEP 3 -->
    <div class="step-content" data-step="3">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:18px;">Escolha a data</h2>
      <div class="form-group">
        <label>Data</label>
        <input type="date" class="form-input" id="dataAgendamento">
      </div>
      <div class="form-group">
        <label>Hor\u00e1rio dispon\u00edvel</label>
        <div class="time-grid" id="timeGrid">
          <div class="time-slot" data-hora="09:00">09:00</div>
          <div class="time-slot" data-hora="10:00">10:00</div>
          <div class="time-slot" data-hora="11:00">11:00</div>
          <div class="time-slot unavailable" data-hora="12:00">12:00</div>
          <div class="time-slot" data-hora="13:00">13:00</div>
          <div class="time-slot" data-hora="14:00">14:00</div>
          <div class="time-slot unavailable" data-hora="15:00">15:00</div>
          <div class="time-slot" data-hora="16:00">16:00</div>
          <div class="time-slot" data-hora="17:00">17:00</div>
          <div class="time-slot" data-hora="18:00">18:00</div>
          <div class="time-slot" data-hora="19:00">19:00</div>
          <div class="time-slot" data-hora="20:00">20:00</div>
        </div>
      </div>
      <div class="btn-wrap">
        <button class="btn btn-ghost" onclick="prevStep(2)">Voltar</button>
        <button class="btn btn-primary" onclick="nextStep(4)">Revisar</button>
      </div>
    </div>

    <!-- STEP 4 -->
    <div class="step-content" data-step="4">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;margin-bottom:18px;">Confirme seu agendamento</h2>
      <div id="confirmacaoContent">
        <div class="summary-row"><span class="summary-label">Nome</span><span class="summary-value" id="resumoNome">\u2014</span></div>
        <div class="summary-row"><span class="summary-label">Telefone</span><span class="summary-value" id="resumoTel">\u2014</span></div>
        <div class="summary-row"><span class="summary-label">Servi\u00e7o</span><span class="summary-value" id="resumoServico">\u2014</span></div>
        <div class="summary-row"><span class="summary-label">Profissional</span><span class="summary-value" id="resumoProf">\u2014</span></div>
        <div class="summary-row"><span class="summary-label">Data</span><span class="summary-value" id="resumoData">\u2014</span></div>
        <div class="summary-row"><span class="summary-label">Hor\u00e1rio</span><span class="summary-value" id="resumoHora">\u2014</span></div>
      </div>
      <div class="btn-wrap">
        <button class="btn btn-ghost" onclick="prevStep(3)">Voltar</button>
        <button class="btn btn-primary" onclick="confirmarAgendamento()">Confirmar agendamento</button>
      </div>
    </div>

    <!-- SUCCESS -->
    <div class="step-content" data-step="success">
      <div class="success-screen">
        <div class="check">\u2713</div>
        <h2>Agendamento confirmado!</h2>
        <p>Enviamos um lembrete para o telefone informado. Voc\u00ea pode agendar outro hor\u00e1rio ou fechar esta p\u00e1gina.</p>
        <button class="btn btn-primary" style="margin-top:24px;" onclick="location.reload()">Novo agendamento</button>
      </div>
    </div>

  </div>
</div>

<script>
  var currentStep = 1;
  var selectedServico = 'Limpeza de pele profunda';
  var selectedHora = '';

  (function() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var el = document.getElementById('dataAgendamento');
    if (el) el.value = d.toISOString().slice(0, 10);
  })();

  document.querySelectorAll('.service-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.service-card').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
      selectedServico = this.getAttribute('data-servico');
    });
  });

  document.querySelectorAll('.time-slot').forEach(function(slot) {
    slot.addEventListener('click', function() {
      if (this.classList.contains('unavailable')) return;
      document.querySelectorAll('.time-slot').forEach(function(s) { s.classList.remove('selected'); });
      this.classList.add('selected');
      selectedHora = this.getAttribute('data-hora');
    });
  });

  function nextStep(step) {
    var nome = document.getElementById('nome').value.trim();
    var tel = document.getElementById('tel').value.trim();
    if (currentStep === 1 && (!nome || !tel)) {
      alert('Preencha nome e telefone para continuar.');
      return;
    }
    if (step === 4) {
      var prof = document.getElementById('profissional');
      document.getElementById('resumoNome').textContent = nome;
      document.getElementById('resumoTel').textContent = tel;
      document.getElementById('resumoServico').textContent = selectedServico;
      document.getElementById('resumoProf').textContent = prof.options[prof.selectedIndex].text;
      document.getElementById('resumoData').textContent = document.getElementById('dataAgendamento').value;
      document.getElementById('resumoHora').textContent = selectedHora || 'N\u00e3o selecionado';
    }
    goToStep(step);
  }

  function prevStep(step) { goToStep(step); }

  function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-content').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.step').forEach(function(s) {
      s.classList.remove('active', 'done');
      var n = parseInt(s.getAttribute('data-step'));
      if (n === step) s.classList.add('active');
      else if (n < step) s.classList.add('done');
    });
    var el = document.querySelector('.step-content[data-step="' + step + '"]');
    if (el) el.classList.add('active');
  }

  function confirmarAgendamento() {
    if (!selectedHora) {
      alert('Selecione um hor\u00e1rio.');
      goToStep(3);
      return;
    }
    goToStep('success');
  }
</script>

</body>
</html>"""

with open('agendar.html', 'w', encoding='utf-8') as f:
    f.write(agendar_content)
print("FIX 4: agendar.html created with complete booking page")

print("\n=== ALL FIXES APPLIED SUCCESSFULLY ===")
