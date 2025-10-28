export class HighlightState {
  private static isTextHighlighted: boolean = false;

  public static getHighlightState(): boolean {
    return HighlightState.isTextHighlighted;
  }

  public static setHighlightState(highlighted: boolean): void {
    HighlightState.isTextHighlighted = highlighted;
  }
}
