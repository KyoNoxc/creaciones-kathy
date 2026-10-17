import { createElement, useLayoutEffect, useRef } from "react";

interface Props {
  valor: string;
  onCambio?: (texto: string) => void;
  /** Sin onCambio o con bloqueado, el dato solo se muestra. */
  bloqueado?: boolean;
  como?: "div" | "b" | "td" | "span";
  className?: string;
}

/**
 * Dato de la hoja que se corrige con clic. Mientras se escribe no se repinta
 * (para no mover el cursor); al salir se muestra el valor ya normalizado.
 */
export function Editable({ valor, onCambio, bloqueado, como = "div", className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const editable = !!onCambio && !bloqueado;

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== valor) el.textContent = valor;
  }, [valor]);

  return createElement(como, {
    ref,
    className,
    contentEditable: editable || undefined,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onInput: editable ? (e: React.FormEvent<HTMLElement>) => onCambio!(e.currentTarget.textContent ?? "") : undefined,
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (e.currentTarget.textContent !== valor) e.currentTarget.textContent = valor;
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
  });
}
