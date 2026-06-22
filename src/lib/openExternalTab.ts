export function openBlankExternalTab(): Window | null {
  return window.open('about:blank', '_blank', 'noopener,noreferrer');
}

export function navigateExternalTab(popup: Window | null, url: string): void {
  if (popup && !popup.closed) {
    try {
      popup.location.replace(url);
      return;
    } catch {
      // ignore and fall through
    }
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    console.warn('[external-tab] popup blocked; keeping current page unchanged');
  }
}
