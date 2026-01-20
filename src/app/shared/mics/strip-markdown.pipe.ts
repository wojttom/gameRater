import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripMarkdown',
  standalone: true,
})
export class StripMarkdownPipe implements PipeTransform {
  transform(value: string, maxLength?: number): string {
    if (!value) return '';

    let text = value
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/!\[.*?\]\(.+?\)/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[-*_]{3,}\s*$/gm, '')
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .trim();

    if (maxLength && text.length > maxLength) {
      text = text.slice(0, maxLength) + '...';
    }

    return text;
  }
}
