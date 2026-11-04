import { h, clear } from "./dom";

/** Named browser saves contain inputs only; prices are always recalculated. */
export function savedPanel<T>(kind: string, read: () => T, apply: (value: T) => void, valid: (value: unknown) => value is T): HTMLElement {
  const key = `tokenplan:saved:${kind}:v1`;
  let entries: { name: string; value: T }[] = [];
  const status = h("span", { role: "status" });
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(stored)) throw new Error("Invalid saved data");
    entries = stored.filter((item) => item && typeof item.name === "string" && valid(item.value));
  } catch { status.textContent = "Browser saves are unavailable or could not be read."; }
  const select = h("select", { "aria-label": `Saved ${kind}` });
  const name = h("input", { type: "text", maxlength: "80", placeholder: "Name this save", "aria-label": `Name for ${kind}` });
  const refresh = () => {
    clear(select);
    select.append(h("option", { value: "" }, `Saved ${kind}`));
    entries.forEach((entry, index) => select.append(h("option", { value: String(index) }, entry.name)));
  };
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify(entries)); status.textContent = "Saved in this browser."; }
    catch { status.textContent = "Could not save in this browser. You can continue using the page."; }
    refresh();
  };
  const button = (label: string, action: () => void) => {
    const node = h("button", { type: "button", class: "btn btn--ghost" }, label);
    node.addEventListener("click", action);
    return node;
  };
  const selected = () => select.value === "" ? -1 : Number(select.value);
  refresh();
  return h("div", { class: "saved-controls" }, [name, select,
    button("Save", () => {
      const label = name.value.trim();
      const value = read();
      if (!label || !valid(value)) { status.textContent = "Enter a name and valid inputs first."; return; }
      if (entries.some((item) => item.name === label)) { status.textContent = "Choose a unique name, or delete the previous save."; return; }
      entries.push({ name: label, value }); persist();
    }),
    button("Load", () => { const entry = entries[selected()]; if (entry) { apply(entry.value); name.value = entry.name; } }),
    button("Rename", () => {
      const index = selected(), label = name.value.trim();
      if (index < 0 || !label) { status.textContent = "Choose a save and enter its new name."; return; }
      if (entries.some((entry, at) => at !== index && entry.name === label)) { status.textContent = "That name is already used."; return; }
      entries[index].name = label; persist();
    }),
    button("Delete", () => { const index = selected(); if (index >= 0) { entries.splice(index, 1); persist(); } }), status,
  ]);
}
