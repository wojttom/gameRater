import { Component } from '@angular/core';


@Component({
  selector: 'app-vid-gallery',
  imports: [],
  standalone: true,
  templateUrl: './vid-gallery.html',
  styleUrls: ['./vid-gallery.scss'],
})
export class VidGallery {
  videos = [
    { url: 'videos/baldurs.mp4' },
    { url: 'videos/bf.mp4', start: 0, end: 25 },
    { url: 'videos/stardew.mp4' },
    { url: 'videos/cs.mp4', start: 1, end: 11 },
    { url: 'videos/f1.mp4', end: 22 },
    { url: 'videos/guitarHero.mp4' },
    { url: 'videos/league.mp4', start: 16 , end: 40},
    { url: 'videos/steep.mp4', start: 5 },
    { url: 'videos/yakuza.mp4' }
  ];
  get duplicatedVideos() {
    return [...this.videos, ...this.videos];
  }
  videoOptions(event: Event, video: any) {
    const videoElement = event.target as HTMLVideoElement;
    videoElement.currentTime = video.start || 0;
    videoElement.play();
  }
  checkEndTime(event: Event, video: any) {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement.currentTime >= (video.end || videoElement.duration) - 0.3) {
      videoElement.currentTime = video.start || 0;
      videoElement.play();
    }
  }
}

