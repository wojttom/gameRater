import { Routes } from '@angular/router';
import { LoginSite } from './login-site/login-site';
import { MainSite } from './main-site/main-site';
import { RegisterSite } from './register-site/register-site';
import { GameInfo } from './game-info/game-info';
import { UserProfile } from './user-profile/user-profile';
import { AddGame } from './add-game/add-game';
import { BlogPost } from './blog-post/blog-post';
import { Forum } from './forum/forum';

export const routes: Routes = [
  { path: '', component: MainSite },
  { path: 'login', component: LoginSite },
  { path: 'register', component: RegisterSite },
  { path: 'forum', component: Forum },
  { path: 'g/:appid', component: GameInfo },
  { path: 'u/:username', component: UserProfile },
  { path: 'u/:username/post/:postId', component: BlogPost },
  { path: 'add-game', component: AddGame },
];
