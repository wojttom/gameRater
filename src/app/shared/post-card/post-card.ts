import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { VoteButtonsComponent } from '../vote-buttons/vote-buttons';
import { GameBadgeComponent } from '../game-badge/game-badge';
import { StripMarkdownPipe } from '../mics/strip-markdown.pipe';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
  imports: [DatePipe, VoteButtonsComponent, GameBadgeComponent, StripMarkdownPipe],
})
export class PostCardComponent {
  @Input() post: any;
  @Input() showAuthor: boolean = false;

  constructor(private router: Router) {}

  goToPost() {
    const username = this.post.authorId?.username || this.post.authorId;
    this.router.navigate(['/u', username, 'post', this.post._id]);
  }

  goToGame(appid: string | number) {
    this.router.navigate(['/g', appid]);
  }

  goToAuthor() {
    if (this.post.authorId?.username) {
      this.router.navigate(['/u', this.post.authorId.username]);
    }
  }
}
