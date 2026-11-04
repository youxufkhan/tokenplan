/** Plans picked for side-by-side comparison; at most four. */
const picked: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const MAX_COMPARE = 4;
export const selection = {
  has: (id: string) => picked.includes(id),
  ids: () => [...picked],
  toggle(id: string): boolean {
    const at = picked.indexOf(id);
    if (at >= 0) picked.splice(at, 1);
    else if (picked.length < MAX_COMPARE) picked.push(id);
    else return false;
    emit();
    return true;
  },
  set(ids: string[]) { picked.splice(0, picked.length, ...[...new Set(ids)].slice(0, MAX_COMPARE)); emit(); },
  clear() { picked.length = 0; emit(); },
  subscribe(fn: () => void) { listeners.add(fn); },
};
