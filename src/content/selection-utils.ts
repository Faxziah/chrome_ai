export function getSelectedText(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const text = selection.toString().trim();
  return text.length > 0 ? text : null;
}

export function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();
  
  let rect: DOMRect;
  if (rects.length > 0) {
    rect = rects[rects.length - 1];
  } else {
    rect = range.getBoundingClientRect();
  }

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return rect;
}

export function isValidSelection(text: string | null, minLength: number = 3): text is string {
  return text !== null && text.length >= minLength && !/^\s+$/.test(text);
}

export function getSelectionContext(maxChars: number = 100): { before: string; selected: string; after: string } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString();

  const beforeRange = range.cloneRange();
  beforeRange.setEnd(range.startContainer, range.startOffset);
  beforeRange.setStart(range.startContainer, Math.max(0, range.startOffset - maxChars));
  const before = beforeRange.toString();

  const afterRange = range.cloneRange();
  afterRange.setStart(range.endContainer, range.endOffset);
  afterRange.setEnd(range.endContainer, Math.min(range.endOffset + maxChars, range.endContainer.textContent?.length || 0));
  const after = afterRange.toString();

  return {
    before,
    selected: selectedText,
    after
  };
}

export function clearSelection(): void {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

export function selectText(element: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  context?: { before: string; selected: string; after: string };
}

export function getSelectionInfo(): SelectionInfo | null {
  const text = getSelectedText();
  const rect = getSelectionRect();
  
  if (!text || !rect) {
    return null;
  }

  return {
    text,
    rect,
    context: getSelectionContext() || undefined
  };
}
