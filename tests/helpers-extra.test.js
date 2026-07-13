import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helpers is loaded as a global via setup.js

describe('Helpers — funções complementares', () => {

  // ---- showToast ----
  describe('showToast', () => {
    beforeEach(() => {
      // Limpa toasts anteriores
      document.querySelectorAll('.fusion-toast').forEach(function(el) { el.remove(); });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve criar elemento toast no DOM', () => {
      Helpers.showToast('Mensagem de teste', 'success');
      const toast = document.querySelector('.fusion-toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('Mensagem de teste');
    });

    it('deve aplicar estilo de sucesso (fundo verde)', () => {
      Helpers.showToast('Sucesso!', 'success');
      const toast = document.querySelector('.fusion-toast');
      expect(toast.style.background).toBe('#4C7A5E');
      expect(toast.style.color).toBe('#fff');
    });

    it('deve aplicar estilo de erro (fundo vermelho)', () => {
      Helpers.showToast('Erro!', 'error');
      const toast = document.querySelector('.fusion-toast');
      expect(toast.style.background).toBe('#B14E3D');
      expect(toast.style.color).toBe('#fff');
    });

    it('deve remover toast após 3 segundos', () => {
      Helpers.showToast('Temporário', 'success');
      expect(document.querySelector('.fusion-toast')).not.toBeNull();
      
      vi.advanceTimersByTime(3000);
      expect(document.querySelector('.fusion-toast')).toBeNull();
    });

    it('deve remover toast anterior se existir', () => {
      Helpers.showToast('Primeiro', 'success');
      Helpers.showToast('Segundo', 'success');
      
      const toasts = document.querySelectorAll('.fusion-toast');
      expect(toasts).toHaveLength(1);
      expect(toasts[0].textContent).toBe('Segundo');
    });

    it('deve ter estilo position fixed', () => {
      Helpers.showToast('Teste', 'success');
      const toast = document.querySelector('.fusion-toast');
      expect(toast.style.position).toBe('fixed');
      expect(toast.style.bottom).toBe('24px');
      expect(toast.style.right).toBe('24px');
    });
  });

  // ---- getTableData ----
  describe('getTableData', () => {
    it('deve extrair headers e rows de uma tabela HTML', () => {
      document.body.innerHTML = `
        <table>
          <thead>
            <tr><th>Nome</th><th>Idade</th><th>Cidade</th></tr>
          </thead>
          <tbody>
            <tr><td>Ana</td><td>30</td><td>São Paulo</td></tr>
            <tr><td>João</td><td>25</td><td>Rio de Janeiro</td></tr>
          </tbody>
        </table>
      `;

      const table = document.querySelector('table');
      const result = Helpers.getTableData(table);
      
      expect(result.headers).toEqual(['Nome', 'Idade', 'Cidade']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['Ana', '30', 'São Paulo']);
      expect(result.rows[1]).toEqual(['João', '25', 'Rio de Janeiro']);
    });

    it('deve retornar arrays vazios para tabela sem dados', () => {
      document.body.innerHTML = `
        <table>
          <thead><tr><th>Coluna</th></tr></thead>
          <tbody></tbody>
        </table>
      `;

      const result = Helpers.getTableData(document.querySelector('table'));
      expect(result.headers).toEqual(['Coluna']);
      expect(result.rows).toEqual([]);
    });

    it('deve lidar com células vazias', () => {
      document.body.innerHTML = `
        <table>
          <thead><tr><th>A</th><th>B</th></tr></thead>
          <tbody>
            <tr><td>Valor</td><td></td></tr>
          </tbody>
        </table>
      `;

      const result = Helpers.getTableData(document.querySelector('table'));
      expect(result.rows[0]).toEqual(['Valor', '']);
    });

    it('deve lidar com conteúdo HTML nas células', () => {
      document.body.innerHTML = `
        <table>
          <thead><tr><th>Status</th></tr></thead>
          <tbody>
            <tr><td><span class="status-chip ok">Ativo</span></td></tr>
          </tbody>
        </table>
      `;

      const result = Helpers.getTableData(document.querySelector('table'));
      expect(result.rows[0][0]).toBe('Ativo');
    });
  });

  // ---- exportTablesToCSV ----
  describe('exportTablesToCSV', () => {
    beforeEach(() => {
      // Mock downloadFile
      vi.spyOn(Helpers, 'downloadFile').mockImplementation(function(content, filename) {
        // Don't actually download in tests
      });
      vi.spyOn(Helpers, 'showToast').mockImplementation(function() {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('deve exportar tabela com sucesso', () => {
      document.body.innerHTML = `
        <div data-view="relatorios">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Valor</th></tr></thead>
              <tbody>
                <tr><td>Ana</td><td>R$ 100</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      expect(Helpers.downloadFile).toHaveBeenCalled();
      expect(Helpers.showToast).toHaveBeenCalledWith(
        expect.stringContaining('CSV exportado'),
        'success'
      );
    });

    it('deve gerar CSV com BOM e cabeçalho', () => {
      document.body.innerHTML = `
        <div data-view="relatorios">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Idade</th></tr></thead>
              <tbody>
                <tr><td>Maria</td><td>28</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      const csvContent = Helpers.downloadFile.mock.calls[0][0];
      // BOM (\\uFEFF) deve estar presente para encoding correto
      expect(csvContent.charCodeAt(0)).toBe(0xFEFF);
      expect(csvContent).toContain('Nome;Idade');
      expect(csvContent).toContain('Maria;28');
    });

    it('deve mostrar toast de erro se não houver tabelas', () => {
      document.body.innerHTML = '<div data-view="relatorios"></div>';
      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      expect(Helpers.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Nenhum dado encontrado'),
        'error'
      );
      expect(Helpers.downloadFile).not.toHaveBeenCalled();
    });

    it('deve exportar múltiplas tabelas', () => {
      document.body.innerHTML = `
        <div data-view="relatorios">
          <div class="table-wrap">
            <table>
              <thead><tr><th>A</th></tr></thead>
              <tbody><tr><td>1</td></tr></tbody>
            </table>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>B</th></tr></thead>
              <tbody><tr><td>2</td></tr></tbody>
            </table>
          </div>
        </div>
      `;

      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      // Deve chamar downloadFile para cada tabela
      expect(Helpers.downloadFile).toHaveBeenCalledTimes(2);
    });

    it('não deve exportar tabelas vazias', () => {
      document.body.innerHTML = `
        <div data-view="relatorios">
          <div class="table-wrap">
            <table>
              <thead><tr><th>A</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      `;

      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      expect(Helpers.downloadFile).not.toHaveBeenCalled();
    });

    it('deve escapar ponto-e-vírgula nas células', () => {
      document.body.innerHTML = `
        <div data-view="relatorios">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>Item; Especial</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      Helpers.exportTablesToCSV('[data-view="relatorios"]');
      const csv = Helpers.downloadFile.mock.calls[0][0];
      expect(csv).toContain('"');
      expect(csv).toContain('Item; Especial');
    });
  });

  // ---- updateDashboardDate ----
  describe('updateDashboardDate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve atualizar o elemento de data com o dia atual', () => {
      document.body.innerHTML = `
        <div id="dashDate">Carregando...</div>
        <div id="dashGreeting">Bem-vinda</div>
      `;

      // Fixa a data para 15 de março de 2024 (sexta-feira)
      vi.setSystemTime(new Date(2024, 2, 15, 14, 30, 0));

      Helpers.updateDashboardDate();

      const dateEl = document.getElementById('dashDate');
      expect(dateEl.textContent).toContain('Sexta');
      expect(dateEl.textContent).toContain('15');
      expect(dateEl.textContent).toContain('março');
    });

    it('deve atualizar saudação baseada no horário', () => {
      document.body.innerHTML = `
        <div id="dashDate">Carregando...</div>
        <div id="dashGreeting">Bem-vinda</div>
      `;

      // Fixa para 10h (manhã)
      vi.setSystemTime(new Date(2024, 5, 15, 10, 0, 0));
      Helpers.updateDashboardDate();
      expect(document.getElementById('dashGreeting').textContent).toContain('Bom dia');

      // Fixa para 14h (tarde)
      vi.setSystemTime(new Date(2024, 5, 15, 14, 0, 0));
      Helpers.updateDashboardDate();
      expect(document.getElementById('dashGreeting').textContent).toContain('Boa tarde');

      // Fixa para 20h (noite)
      vi.setSystemTime(new Date(2024, 5, 15, 20, 0, 0));
      Helpers.updateDashboardDate();
      expect(document.getElementById('dashGreeting').textContent).toContain('Boa noite');
    });

    it('não deve quebrar se elemento dateEl não existir', () => {
      document.body.innerHTML = '';
      expect(function() { Helpers.updateDashboardDate(); }).not.toThrow();
    });

    it('deve formatar corretamente para primeiro dia do mês', () => {
      document.body.innerHTML = '<div id="dashDate">Carregando...</div>';
      vi.setSystemTime(new Date(2024, 0, 1, 9, 0, 0));
      Helpers.updateDashboardDate();
      const el = document.getElementById('dashDate');
      expect(el.textContent).toContain('1');
      expect(el.textContent).toContain('janeiro');
    });
  });
});
