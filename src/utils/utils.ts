import { marked } from 'marked';

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatMarkdown(text: string): string {
  const textWithNewLines = text.replace(/\n/g, '<br>');
  return marked.parse(textWithNewLines).toString();
}
