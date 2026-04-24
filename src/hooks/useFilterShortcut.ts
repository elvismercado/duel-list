import { useEffect, type RefObject } from 'react';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Focuses the given input when the user presses `/` outside of any text-entry
 * context. Skips when a Radix dialog is open or when modifier keys are held.
 */
export function useFilterShortcut(ref: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Skip when a modal dialog is mounted.
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      const input = ref.current;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref]);
}
