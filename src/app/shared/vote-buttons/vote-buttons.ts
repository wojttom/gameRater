import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../../../../backend/services/authService';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vote-buttons',
  templateUrl: './vote-buttons.html',
  styleUrls: ['./vote-buttons.scss'],
})
export class VoteButtonsComponent implements OnInit {
  @Input() targetType: 'post' | 'comment' | 'review' | 'user' = 'post';
  @Input() targetId: string = '';
  @Input() upvotes: number = 0;
  @Input() downvotes: number = 0;
  @Input() score: number = 0;
  @Input() userVote: number | null = null;
  @Input() horizontal: boolean = true;
  @Input() hideScore: boolean = false;
  @Output() voteChanged = new EventEmitter<{
    upvotes: number;
    downvotes: number;
    score: number;
    userVote: number | null;
  }>();

  isVoting = false;
  isLoggedIn = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  vote(value: 1 | -1) {
    if (this.isVoting) return;
    if (!this.isLoggedIn) {
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
        { withCredentials: true },
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
