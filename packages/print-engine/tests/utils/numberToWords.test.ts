import { describe, it, expect } from 'vitest';
import { numberToWordsINR } from '../../src/utils/numberToWords';

describe('numberToWordsINR', () => {
  it('handles 0', () => {
    expect(numberToWordsINR(0)).toBe('Zero');
  });

  it('handles 1', () => {
    expect(numberToWordsINR(1)).toBe('One');
  });

  it('handles 10', () => {
    expect(numberToWordsINR(10)).toBe('Ten');
  });

  it('handles 105', () => {
    expect(numberToWordsINR(105)).toBe('One Hundred and Five');
  });

  it('handles 1000', () => {
    expect(numberToWordsINR(1000)).toBe('One Thousand');
  });

  it('handles 12345', () => {
    expect(numberToWordsINR(12345)).toBe('Twelve Thousand Three Hundred and Forty Five');
  });

  it('handles 100000', () => {
    expect(numberToWordsINR(100000)).toBe('One Lakh');
  });

  it('handles 1000000', () => {
    expect(numberToWordsINR(1000000)).toBe('Ten Lakh');
  });

  it('handles negative numbers safely', () => {
    expect(numberToWordsINR(-105)).toBe('One Hundred and Five'); // Assumes Math.abs handles it
  });

  it('handles 25 (tens + units)', () => {
    expect(numberToWordsINR(25)).toBe('Twenty Five');
  });

  it('handles 99 (tens + units)', () => {
    expect(numberToWordsINR(99)).toBe('Ninety Nine');
  });

  it('handles 99999999', () => {
    expect(numberToWordsINR(99999999)).toBe(
      'Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred and Ninety Nine',
    );
  });

  it('handles invalid inputs gracefully', () => {
    expect(numberToWordsINR(NaN)).toBe('');
  });

  it('handles overflow', () => {
    expect(numberToWordsINR(10000000000)).toBe('Overflow');
  });
});
