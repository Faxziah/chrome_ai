import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Rephraser } from './rephraser';
import { createMockGeminiService } from '../test/test-utils';

describe('Rephraser', () => {
  let mockGeminiService: ReturnType<typeof createMockGeminiService>;
  let rephraser: Rephraser;

  beforeEach(() => {
    mockGeminiService = createMockGeminiService();
    rephraser = new Rephraser(mockGeminiService as any);
  });

  it('should rephrase text with casual style', async () => {
    const mockResponse = 'This is a casual rephrased version of the text.';
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: mockResponse,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const result = await rephraser.rephrase('test text', { style: 'casual' });

    expect(result.rephrasedText).toBe(mockResponse);
    expect(result.style).toBe('casual');
    expect(result.originalLength).toBe(9);
    expect(result.rephrasedLength).toBe(mockResponse.length);
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.stringContaining('неформальный'),
      expect.objectContaining({
        temperature: 0.7,
        maxTokens: 2048
      })
    );
  });

  it('should rephrase with different styles', async () => {
    const styles = ['casual', 'formal', 'professional', 'friendly', 'academic'] as const;
    
    for (const style of styles) {
      const mockResponse = `Rephrased in ${style} style`;
      mockGeminiService.generateContent.mockResolvedValueOnce({
        text: mockResponse,
        usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
      });

      await rephraser.rephrase('test text', { style });
      
      expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('Перефразируй'),
        expect.any(Object)
      );
    }
  });

  it('should throw error for empty text', async () => {
    await expect(rephraser.rephrase('', { style: 'casual' }))
      .rejects.toThrow('Text cannot be empty');
  });

  it('should calculate length delta correctly', async () => {
    const originalText = 'short';
    const rephrasedText = 'This is a much longer rephrased version of the text.';
    
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: rephrasedText,
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    const result = await rephraser.rephrase(originalText, { style: 'casual' });
    
    expect(result.lengthDelta).toBe(rephrasedText.length - originalText.length);
  });

  it('should use correct temperature for rephrasing', async () => {
    mockGeminiService.generateContent.mockResolvedValueOnce({
      text: 'rephrased',
      usage: { promptTokens: 10, candidatesTokens: 20, totalTokens: 30 }
    });

    await rephraser.rephrase('test', { style: 'casual' });
    
    expect(mockGeminiService.generateContent).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        temperature: 0.7,
        maxTokens: 2048
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    mockGeminiService.generateContent.mockRejectedValueOnce(error);

    await expect(rephraser.rephrase('test', { style: 'casual' }))
      .rejects.toThrow('Failed to rephrase text: API Error');
  });

  it('should support streaming with rephraseWithStream', async () => {
    const chunks = ['chunk1', 'chunk2', 'final'];
    const mockStream = async function* () {
      for (const chunk of chunks) {
        yield { text: chunk, isComplete: false };
      }
      yield { text: '', isComplete: true };
    };
    
    mockGeminiService.streamContent.mockReturnValueOnce(mockStream());

    const collectedChunks: string[] = [];
    const result = await rephraser.rephraseWithStream('test', { style: 'casual' }, (chunk) => {
      collectedChunks.push(chunk);
    });

    expect(collectedChunks).toEqual(chunks);
    expect(result.rephrasedText).toBe(chunks.join(''));
  });
});
