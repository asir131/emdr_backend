import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password } = req.body;
      const result = await authService.signup({ firstName, lastName, email, password });
      res.status(201).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyOTP(email, otp);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async resendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.resendOTPRequest(email);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async recoverAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newPassword } = req.body;
      const userId = (req as any).user?.userId;
      const result = await authService.recoverAccount(userId, newPassword);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async sendVerificationOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await authService.sendVerificationOTP(email, otp);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmailWithToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { otp } = req.body;
      const userId = (req as any).user?.userId;
      const result = await authService.verifyEmailWithToken(userId, otp);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.userId;
      const result = await authService.logout(userId, refreshToken);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      res.status(200).json({ success: true, data: result, meta: { timestamp: new Date().toISOString() } });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const result = await authService.googleAuth(idToken);
      res.status(result.isNewUser ? 201 : 200).json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
