import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { UsersDTO } from 'src/users/dto/create-user.dto';
import { GoogleAuthGuard } from './strategy/google-auth.guard';
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
  googleCallback(@Req() req: { user: User }) {
    return this.authService.googleLogin(req.user);
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
