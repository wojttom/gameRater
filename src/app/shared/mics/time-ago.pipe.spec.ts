import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null value', () => {
    expect(pipe.transform(null as any)).toBe('');
  });

  it('should return empty string for undefined value', () => {
    expect(pipe.transform(undefined as any)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return "just now" for less than 60 seconds ago', () => {
    const date = new Date(Date.now() - 30000); // 30 seconds ago
    expect(pipe.transform(date)).toBe('just now');
  });

  it('should return minutes ago for less than 60 minutes', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    expect(pipe.transform(date)).toBe('5m ago');
  });

  it('should return hours ago for less than 24 hours', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    expect(pipe.transform(date)).toBe('3h ago');
  });

  it('should return days ago for less than 7 days', () => {
    const date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
    expect(pipe.transform(date)).toBe('4d ago');
  });

  it('should return weeks ago for less than 4 weeks', () => {
    const date = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
    expect(pipe.transform(date)).toBe('2w ago');
  });

  it('should return months ago for less than 12 months', () => {
    const date = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000); // ~3 months ago
    expect(pipe.transform(date)).toBe('3mo ago');
  });

  it('should return years ago for more than 12 months', () => {
    const date = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // ~2 years ago
    expect(pipe.transform(date)).toBe('2y ago');
  });

  it('should handle string date input', () => {
    const dateString = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
    expect(pipe.transform(dateString)).toBe('1m ago');
  });

  it('should handle Date object input', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    expect(pipe.transform(date)).toBe('2h ago');
  });

  it('should return 1m ago for exactly 60 seconds', () => {
    const date = new Date(Date.now() - 60 * 1000);
    expect(pipe.transform(date)).toBe('1m ago');
  });

  it('should return 1h ago for exactly 60 minutes', () => {
    const date = new Date(Date.now() - 60 * 60 * 1000);
    expect(pipe.transform(date)).toBe('1h ago');
  });

  it('should return 1d ago for exactly 24 hours', () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toBe('1d ago');
  });

  it('should return 1w ago for exactly 7 days', () => {
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date)).toBe('1w ago');
  });
});
