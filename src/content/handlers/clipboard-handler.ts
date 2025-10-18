export class ClipboardHandler {
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback method:', error);
      return this.fallbackCopyToClipboard(text);
    }
  }

  private static fallbackCopyToClipboard(text: string): boolean {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  }

  public static showCopyFeedback(button: HTMLElement, duration: number = 2000): void {
    const originalText = button.textContent;
    button.textContent = '✓ Copied!';
    button.classList.add('copied');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, duration);
  }

  public static async handleCopyClick(
    event: Event,
    shadowRoot: ShadowRoot,
    resultElementId: string
  ): Promise<void> {
    const button = (event.target as HTMLElement)?.closest('button, .btn') as HTMLElement | null;
    const resultElement = shadowRoot.querySelector(`#${resultElementId}`) as HTMLElement;
    
    if (!resultElement) {
      console.warn(`Result element #${resultElementId} not found`);
      return;
    }
    
    const text = resultElement.textContent?.trim();
    if (!text) {
      alert('No text to copy');
      return;
    }
    
    const success = await this.copyToClipboard(text);
    if (success && button) {
      this.showCopyFeedback(button);
    } else if (!success) {
      alert('Failed to copy to clipboard');
    }
  }
}
