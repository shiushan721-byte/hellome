const STORAGE_KEY = 'hellome_sidebar_collapsed';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function setSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  emit();
}

export function toggleSidebarCollapsed(): void {
  setSidebarCollapsed(!getSidebarCollapsed());
}

export function subscribeSidebarCollapsed(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
