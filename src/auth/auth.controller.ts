import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { UsersDTO } from 'src/users/dto/create-user.dto';
import { GoogleAuthGuard } from './strategy/google-auth.guard';
import { GoogleWebAuthGuard } from './strategy/google-web-auth.guard';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDTO) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: UsersDTO) {
    return this.authService.register(registerDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  googleCallback(@Req() req: { user: User }) {
    const { access_token } = this.authService.googleLogin(req.user);
    return { url: `lionshop://auth/callback?access_token=${access_token}` };
  }

  @Get('google/web')
  @UseGuards(GoogleWebAuthGuard)
  googleWebAuth() {
    // Guard redirects to Google
  }

  @Get('google/web/callback')
  @UseGuards(GoogleWebAuthGuard)
  @Redirect()
  googleWebCallback(@Req() req: { user: User }) {
    const { access_token } = this.authService.googleLogin(req.user);
    return { url: `/auth/token?access_token=${access_token}` };
  }

  @Get('token')
  @Header('Content-Type', 'text/html')
  tokenPage(@Query('access_token') token: string): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Token — Lion Shop</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 36px;
      width: 480px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    h2 { margin-bottom: 8px; font-size: 1.4rem; color: #1e293b; }
    .success { color: #16a34a; font-size: 0.88rem; margin-bottom: 24px; }
    label { display: block; font-size: 0.85rem; color: #475569; margin-bottom: 8px; font-weight: 600; }
    .token-value {
      width: 100%;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.78rem;
      word-break: break-all;
      color: #334155;
      white-space: pre-wrap;
      font-family: monospace;
    }
    .copy-btn {
      margin-top: 12px;
      width: 100%;
      padding: 11px;
      background: #0ea5e9;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .copy-btn:hover { background: #0284c7; }
    .copied { background: #16a34a !important; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Lion Shop — Token</h2>
    <p class="success">Đăng nhập Google thành công!</p>
    <label>Access Token</label>
    <div class="token-value" id="tokenValue">${token}</div>
    <button class="copy-btn" id="copyBtn" onclick="copyToken()">Copy token</button>
  </div>
  <script>
    function copyToken() {
      navigator.clipboard.writeText(document.getElementById('tokenValue').textContent).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Da copy!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy token'; btn.classList.remove('copied'); }, 2000);
      });
    }
  </script>
</body>
</html>`;
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: User }): Omit<User, 'password'> {
    const { password, ...profile } = req.user;
    return profile;
  }

  @Post('signout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  signout(): { message: string } {
    // JWT stateless — client chỉ cần xóa token. Endpoint giữ cho nhất quán API.
    return { message: 'Signed out' };
  }
}
