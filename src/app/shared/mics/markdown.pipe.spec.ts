import { MarkdownPipe } from './markdown.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null value', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined value', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should convert bold text', () => {
    const result = pipe.transform('**bold**');
    expect(result.toString()).toContain('<strong>bold</strong>');
  });

  it('should convert italic text', () => {
    const result = pipe.transform('*italic*');
    expect(result.toString()).toContain('<em>italic</em>');
  });

  it('should convert links', () => {
    const result = pipe.transform('[link](https://example.com)');
    expect(result.toString()).toContain('<a href="https://example.com">link</a>');
  });

  it('should convert inline code', () => {
    const result = pipe.transform('`code`');
    expect(result.toString()).toContain('<code>code</code>');
  });

  it('should convert code blocks', () => {
    const result = pipe.transform('```\ncode block\n```');
    expect(result.toString()).toContain('<pre>');
    expect(result.toString()).toContain('code block');
  });

  it('should convert headers', () => {
    const result = pipe.transform('# Header');
    expect(result.toString()).toContain('<h1>');
  });

  it('should convert unordered lists', () => {
    const result = pipe.transform('- item 1\n- item 2');
    expect(result.toString()).toContain('<ul>');
    expect(result.toString()).toContain('<li>');
  });

  it('should convert blockquotes', () => {
    const result = pipe.transform('> quote');
    expect(result.toString()).toContain('<blockquote>');
  });

  it('should convert line breaks with gfm', () => {
    const result = pipe.transform('line1\nline2');
    expect(result.toString()).toContain('<br');
  });
});
