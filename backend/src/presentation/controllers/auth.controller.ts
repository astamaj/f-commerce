import { Request, Response, Router } from 'express';
import { AuthService } from '../../application/services/auth.service.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const authRouter = Router();
const authService = new AuthService();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, businessName } = req.body;
    const tokens = await authService.register(email, password, name, businessName);
    
    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(201).json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    if (error.message === 'Email already exists') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);

    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

authRouter.post('/oauth/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { email, name, providerId } = req.body;
    // In a real implementation, you would verify the OAuth token with Google/Facebook here
    // rather than trusting the client to pass the email and providerId
    const tokens = await authService.oauthLogin(email, name, provider, providerId);

    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token missing' });
      return;
    }

    const tokens = await authService.refresh(refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
       res.status(401).json({ error: 'Unauthorized' });
       return;
    }

    const profile = await authService.getProfile(userId);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});
