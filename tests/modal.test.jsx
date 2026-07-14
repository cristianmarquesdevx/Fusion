/** @format */

/**
 * Fusion ERP — Testes de Acessibilidade do Modal
 *
 * Cobre:
 *  - Renderização condicional (open=true/false)
 *  - ARIA attributes (role, aria-modal, aria-labelledby, aria-describedby)
 *  - Focus trap cíclico (Tab / Shift+Tab)
 *  - Fechamento com Escape
 *  - Fechamento por clique no overlay (closeOnOverlay)
 *  - Scroll lock (overflow hidden / paddingRight)
 *  - Restauração de foco ao fechar
 *  - Botão de fechar (showClose)
 *  - inert / aria-hidden em irmãos
 *  - title, description, width props
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Polyfill requestAnimationFrame para happy-dom
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Simula tecla Escape no modal
 */
function pressEscape() {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

/**
 * Aguarda requestAnimationFrame resolver
 */
function waitForRaf() {
  return act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Modal — Acessibilidade', () => {
  let Modal;
  let onClose;

  beforeEach(async () => {
    const mod = await import('../src/components/ui/Modal');
    Modal = mod.default;
    onClose = vi.fn();
  });

  afterEach(() => {
    cleanup();
    // Restaura body
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  });

  /* ─── RENDERIZAÇÃO ─── */

  describe('renderização condicional', () => {
    it('deve retornar null quando open=false', () => {
      const { container } = render(<Modal open={false} onClose={onClose} />);
      expect(container.innerHTML).toBe('');
    });

    it('deve renderizar o dialog quando open=true', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('deve desaparecer ao mudar open para false', () => {
      const { rerender } = render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<Modal open={false} onClose={onClose} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  /* ─── ARIA ATTRIBUTES ─── */

  describe('ARIA attributes', () => {
    it('deve ter role="dialog"', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('deve ter aria-modal="true"', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('deve ter aria-labelledby apontando para o título', () => {
      render(<Modal open={true} onClose={onClose} title="Meu Título" />);
      const dialog = screen.getByRole('dialog');
      const labelledby = dialog.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();
      const titleEl = document.getElementById(labelledby);
      expect(titleEl).toBeInTheDocument();
      expect(titleEl.textContent).toBe('Meu Título');
    });

    it('não deve ter aria-labelledby se title não for passado', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('deve ter aria-describedby apontando para a descrição', () => {
      render(<Modal open={true} onClose={onClose} title="T" description="Descrição do modal" />);
      const dialog = screen.getByRole('dialog');
      const describedby = dialog.getAttribute('aria-describedby');
      expect(describedby).toBeTruthy();
      const descEl = document.getElementById(describedby);
      expect(descEl).toBeInTheDocument();
      expect(descEl.textContent).toBe('Descrição do modal');
    });

    it('não deve ter aria-describedby se description não for passado', () => {
      render(<Modal open={true} onClose={onClose} title="T" />);
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });

    it('deve ter tabIndex={-1} no dialog', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('tabindex', '-1');
    });

    it('deve ter data-modal-portal no dialog', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('data-modal-portal');
    });
  });

  /* ─── TÍTULO E DESCRIÇÃO ─── */

  describe('title e description', () => {
    it('deve renderizar o título dentro de h2', () => {
      render(<Modal open={true} onClose={onClose} title="Configurações" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Configurações');
    });

    it('deve renderizar description como sr-only', () => {
      render(<Modal open={true} onClose={onClose} title="T" description="Descrição oculta" />);
      const descEl = screen.getByText('Descrição oculta');
      expect(descEl).toHaveClass('sr-only');
    });

    it('não deve renderizar description se não for passada', () => {
      const { container } = render(<Modal open={true} onClose={onClose} title="T" />);
      expect(container.querySelector('.sr-only')).not.toBeInTheDocument();
    });

    it('deve usar aria-label com fallback se title não for passado', () => {
      render(<Modal open={true} onClose={onClose} description="Fallback label" />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Fallback label');
    });

    it('deve usar aria-label padrão "Modal" se não houver title nem description', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Modal');
    });

    it('deve ter titleId único (gerado com random)', () => {
      render(<Modal open={true} onClose={onClose} title="Teste A" />);
      render(<Modal open={true} onClose={onClose} title="Teste B" />);

      const dialogs = screen.getAllByRole('dialog');
      const idA = dialogs[0].getAttribute('aria-labelledby');
      const idB = dialogs[1].getAttribute('aria-labelledby');
      expect(idA).not.toBe(idB);
    });
  });

  /* ─── BOTÃO FECHAR ─── */

  describe('showClose', () => {
    it('deve renderizar botão fechar por padrão (showClose=true)', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(screen.getByLabelText('Fechar modal')).toBeInTheDocument();
    });

    it('não deve renderizar botão fechar se showClose=false', () => {
      render(<Modal open={true} onClose={onClose} showClose={false} />);
      expect(screen.queryByLabelText('Fechar modal')).not.toBeInTheDocument();
    });

    it('deve chamar onClose ao clicar no botão fechar', () => {
      render(<Modal open={true} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Fechar modal'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  /* ─── BACKDROP ─── */

  describe('backdrop / overlay', () => {
    it('deve ter overlay com aria-hidden', () => {
      render(<Modal open={true} onClose={onClose} />);
      const overlay = document.querySelector('[data-modal-portal] > [aria-hidden="true"]');
      expect(overlay).toBeInTheDocument();
    });

    it('deve fechar ao clicar no overlay se closeOnOverlay=true (padrão)', () => {
      render(<Modal open={true} onClose={onClose} />);
      const overlay = document.querySelector('[data-modal-portal] > div');
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('não deve fechar ao clicar no overlay se closeOnOverlay=false', () => {
      render(<Modal open={true} onClose={onClose} closeOnOverlay={false} />);
      const overlay = document.querySelector('[data-modal-portal] > div');
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  /* ─── SCROLL LOCK ─── */

  describe('scroll lock', () => {
    it('deve desabilitar scroll do body quando aberto', () => {
      render(<Modal open={true} onClose={onClose} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('deve restaurar scroll do body quando fechado', () => {
      const { rerender } = render(<Modal open={true} onClose={onClose} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal open={false} onClose={onClose} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('deve restaurar scroll no unmount', () => {
      const { unmount } = render(<Modal open={true} onClose={onClose} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('deve remover paddingRight no unmount', () => {
      const { unmount } = render(<Modal open={true} onClose={onClose} />);
      unmount();
      expect(document.body.style.paddingRight).toBe('');
    });
  });

  /* ─── FOCUS TRAP ─── */

  describe('focus trap', () => {
    it('deve focar no primeiro elemento focável ao abrir', async () => {
      render(
        <Modal open={true} onClose={onClose} title="Focus">
          <input data-testid="input1" />
          <button data-testid="btn1">Botão</button>
        </Modal>
      );

      await waitForRaf();

      await waitFor(() => {
        // O primeiro elemento focável é o botão fechar (antes do input)
        expect(document.activeElement).toBe(screen.getByLabelText('Fechar modal'));
      });
    });

    it('deve focar no modal se não houver elementos focáveis (showClose=false)', async () => {
      render(
        <Modal open={true} onClose={onClose} title="Sem foco" showClose={false}>
          <p>Apenas texto</p>
        </Modal>
      );

      await waitForRaf();

      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByRole('dialog'));
      });
    });

    it('deve ciclar Tab: último → primeiro', async () => {
      render(
        <Modal open={true} onClose={onClose} title="Ciclo">
          <input data-testid="input1" />
          <button data-testid="btn1">Botão 1</button>
          <button data-testid="btn2">Botão 2</button>
        </Modal>
      );

      await waitForRaf();

      // Define foco manualmente no ÚLTIMO elemento (btn2) para testar o ciclo
      screen.getByTestId('btn2').focus();
      await waitForRaf();
      expect(document.activeElement).toBe(screen.getByTestId('btn2'));

      // Tab: último → primeiro (close button)
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(screen.getByLabelText('Fechar modal'));

      // Tab novamente: primeiro → último (como o primeiro está ativo,
      // o trap não intercepta — precisamos verificar que foi para o último
      // manualmente porque happy-dom não move foco nativamente)
      screen.getByTestId('btn2').focus();
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByLabelText('Fechar modal'));
    });

    it('deve ciclar Shift+Tab: primeiro → último', async () => {
      render(
        <Modal open={true} onClose={onClose} title="Ciclo reverso">
          <input data-testid="input1" />
          <button data-testid="btn1">Último</button>
        </Modal>
      );

      await waitForRaf();

      // Foco começa no primeiro elemento (close button)
      expect(document.activeElement).toBe(screen.getByLabelText('Fechar modal'));

      // Shift+Tab: primeiro → último (btn1)
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(screen.getByTestId('btn1'));

      // Shift+Tab novamente: como o último está ativo, o trap não intercepta
      // (precisa estar no primeiro para ativar o trap reverso)
      screen.getByLabelText('Fechar modal').focus();
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(screen.getByTestId('btn1'));
    });

    it('deve impedir Tab padrão se não houver elementos focáveis', async () => {
      render(
        <Modal open={true} onClose={onClose} title="Sem focáveis">
          <p>Texto</p>
        </Modal>
      );

      await waitForRaf();

      // fireEvent.keyDown retorna false quando preventDefault() foi chamado
      const prevented = fireEvent.keyDown(window, { key: 'Tab' });
      expect(prevented).toBe(false);
    });

    it('deve ignorar Tab se modal estiver fechado', () => {
      render(<Modal open={false} onClose={onClose} />);
      const prevented = fireEvent.keyDown(window, { key: 'Tab' });
      expect(prevented).toBe(true);
    });
  });

  /* ─── ESCAPE ─── */

  describe('fechamento com Escape', () => {
    it('deve chamar onClose ao pressionar Escape', () => {
      render(<Modal open={true} onClose={onClose} />);
      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('deve parar propagação do evento Escape', () => {
      const handler2 = vi.fn();
      window.addEventListener('keydown', handler2);

      render(<Modal open={true} onClose={onClose} />);
      pressEscape();

      // O segundo listener não deve ser chamado (stopPropagation)
      expect(handler2).not.toHaveBeenCalled();
      // Verificamos que onClose foi chamado (prova que o handler rodou)
      expect(onClose).toHaveBeenCalled();

      window.removeEventListener('keydown', handler2);
    });

    it('não deve chamar onClose se modal estiver fechado', () => {
      render(<Modal open={false} onClose={onClose} />);
      pressEscape();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('não deve quebrar se onClose não for passado', () => {
      render(<Modal open={true} />);
      expect(() => pressEscape()).not.toThrow();
    });
  });

  /* ─── FOCUS RESTORATION ─── */

  describe('restauração de foco', () => {
    it('deve restaurar foco para o elemento que abriu o modal', async () => {
      // Renderiza um botão que abre o modal
      function TestContainer() {
        const [isOpen, setIsOpen] = React.useState(false);
        const btnRef = React.useRef(null);

        return (
          <div>
            <button ref={btnRef} onClick={() => setIsOpen(true)}>
              Abrir modal
            </button>
            <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Teste" />
          </div>
        );
      }

      const { getByText } = render(<TestContainer />);
      const openBtn = getByText('Abrir modal');

      // Foca no botão
      openBtn.focus();
      expect(document.activeElement).toBe(openBtn);

      // Abre o modal
      fireEvent.click(openBtn);
      await waitForRaf();

      // Foco está no modal
      await waitFor(() => {
        expect(document.activeElement).not.toBe(openBtn);
      });

      // Fecha o modal
      pressEscape();

      // Foco volta para o botão
      await waitFor(() => {
        expect(document.activeElement).toBe(openBtn);
      });
    });
  });

  /* ─── INERT / ARIA-HIDDEN ─── */

  describe('inert e aria-hidden em irmãos', () => {
    it('deve adicionar aria-hidden nos irmãos quando abre', () => {
      render(
        <div>
          <header data-testid="sibling">Header</header>
          <Modal open={true} onClose={onClose} title="Modal" />
          <footer data-testid="sibling2">Footer</footer>
        </div>
      );

      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      expect(header.getAttribute('aria-hidden')).toBe('true');
      expect(footer.getAttribute('aria-hidden')).toBe('true');
    });

    it('deve remover aria-hidden dos irmãos quando fecha', () => {
      const { rerender } = render(
        <div>
          <header>Sibling</header>
          <Modal open={true} onClose={onClose} title="M" />
        </div>
      );

      const header = document.querySelector('header');
      expect(header.getAttribute('aria-hidden')).toBe('true');

      rerender(
        <div>
          <header>Sibling</header>
          <Modal open={false} onClose={onClose} title="M" />
        </div>
      );

      expect(header.getAttribute('aria-hidden')).toBe('false');
    });

    it('não deve adicionar aria-hidden em elementos data-modal-portal', () => {
      render(
        <div>
          <div data-modal-portal>Outro portal</div>
          <Modal open={true} onClose={onClose} title="M" />
        </div>
      );

      const portal = document.querySelector('[data-modal-portal]:not([role="dialog"])');
      expect(portal).not.toHaveAttribute('aria-hidden');
    });
  });

  /* ─── WIDTH ─── */

  describe('width prop', () => {
    it('deve usar width padrão 560px', () => {
      render(<Modal open={true} onClose={onClose} title="T" />);
      const card = document.querySelector('[style*="max-width"]');
      expect(card.style.maxWidth).toBe('560px');
    });

    it('deve aceitar width customizado', () => {
      render(<Modal open={true} onClose={onClose} title="T" width="800px" />);
      const card = document.querySelector('[style*="max-width"]');
      expect(card.style.maxWidth).toBe('800px');
    });
  });

  /* ─── CHILDREN ─── */

  describe('children', () => {
    it('deve renderizar children no content area', () => {
      render(
        <Modal open={true} onClose={onClose} title="T">
          <p data-testid="child">Conteúdo do modal</p>
        </Modal>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Conteúdo do modal')).toBeInTheDocument();
    });
  });

  /* ─── EDGE CASES ─── */

  describe('edge cases', () => {
    it('não deve quebrar se onClose mudar entre renders (onCloseRef)', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();

      const { rerender } = render(<Modal open={true} onClose={onClose1} title="T" />);
      rerender(<Modal open={true} onClose={onClose2} title="T" />);

      pressEscape();
      // Deve chamar a função mais recente (onClose2)
      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalledTimes(1);
    });

    it('não deve registrar listeners quando fechado', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<Modal open={false} onClose={onClose} />);
      expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), true);

      unmount();
      expect(removeSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), true);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('deve registrar e remover listeners de teclado ao abrir/fechar', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const { rerender } = render(<Modal open={false} onClose={onClose} />);
      expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), true);

      rerender(<Modal open={true} onClose={onClose} />);
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

      rerender(<Modal open={false} onClose={onClose} />);
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('não deve registrar listener duplicado ao re-renderizar aberto', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');

      const { rerender } = render(<Modal open={true} onClose={onClose} title="A" />);
      const callsAbertos = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;

      rerender(<Modal open={true} onClose={onClose} title="B" />);
      const callsDepois = addSpy.mock.calls.filter(([type]) => type === 'keydown').length;

      // Não deve registrar novo listener ao re-renderizar já aberto
      expect(callsDepois).toBe(callsAbertos);

      addSpy.mockRestore();
    });
  });
});
