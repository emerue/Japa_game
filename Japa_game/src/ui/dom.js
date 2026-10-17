// @ts-check

/**
 * Minimal element builder. Children are appended as nodes or text (never parsed as HTML).
 * @param {string} tag
 * @param {Record<string, unknown>} [props] Attributes; `on*` functions become event listeners.
 * @param {...(Node | string | number | null | undefined | false | Array<Node | string | null | undefined | false>)} children
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), /** @type {EventListener} */ (value));
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, String(value));
    }
  }
  for (const child of children.flat()) {
    if (child != null && child !== false) el.append(typeof child === 'number' ? String(child) : child);
  }
  return el;
}
