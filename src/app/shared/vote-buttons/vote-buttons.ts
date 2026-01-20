import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vote-buttons',
  templateUrl: './vote-buttons.html',
  styleUrl: './vote-buttons.scss',
})
export class VoteButtonsComponent implements OnInit {
  @Input() targetType: 'post' | 'comment' | 'review' = 'post';
  @Input() targetId: string = '';
  @Input() upvotes: number = 0;
  @Input() downvotes: number = 0;
  @Input() score: number = 0;
  @Input() userVote: number | null = null;
  @Input() vertical: boolean = true;
  @Output() voteChanged = new EventEmitter<{
    upvotes: number;
    downvotes: number;
    score: number;
    userVote: number | null;
  }>();

  isVoting = false;
  isLoggedIn = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.isLoggedIn = !!localStorage.getItem('token');
  }

  vote(value: 1 | -1) {
    if (this.isVoting) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.isVoting = true;

    this.http
      .post<any>(
        '/api/vote',
        {
          targetType: this.targetType,
          targetId: this.targetId,
          value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .subscribe({
        next: (response) => {
          this.upvotes = response.upvotes;
          this.downvotes = response.downvotes;
          this.score = response.score;
          this.userVote = response.userVote;
          this.voteChanged.emit({
            upvotes: this.upvotes,
            downvotes: this.downvotes,
            score: this.score,
            userVote: this.userVote,
          });
          this.isVoting = false;
        },
        error: (err) => {
          console.error('Vote error:', err);
          this.isVoting = false;
          if (err.error?.error) {
            alert(err.error.error);
          }
        },
      });
  }
}
