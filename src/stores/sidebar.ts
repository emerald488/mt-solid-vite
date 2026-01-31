import { createSignal } from 'solid-js';

const STORAGE_KEY = 'mt-sidebar-collapsed';

function getStoredState(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

const [collapsed, setCollapsedSignal] = createSignal<boolean>(getStoredState());

export function useSidebar() {
  return collapsed;
}

export function setSidebarCollapsed(value: boolean) {
  setCollapsedSignal(value);
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function toggleSidebar() {
  setSidebarCollapsed(!collapsed());
}
