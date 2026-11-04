/** Minimal DOM helper: no framework, the site renders static data and bundle size matters. */

type Attrs = Record<string, string | number | boolean | null | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null = {},
  children: Array<Node | string | null | undefined> | Node | string | null = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = String(v);
    else if (k === "html") node.innerHTML = String(v);
    else if (k.startsWith("data-") || k === "role" || k.startsWith("aria-")) node.setAttribute(k, String(v));
    else if (k in node) (node as unknown as Record<string, unknown>)[k] = v;
    else node.setAttribute(k, String(v));
  }
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c != null) node.append(c);
  }
  return node;
}

export const frag = (children: Array<Node | string | null | undefined>): DocumentFragment => {
  const f = document.createDocumentFragment();
  for (const c of children) if (c != null) f.append(c);
  return f;
};

export const clear = (node: Element) => {
  while (node.firstChild) node.removeChild(node.firstChild);
};
