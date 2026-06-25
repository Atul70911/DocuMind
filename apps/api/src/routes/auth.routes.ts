import { Hono } from 'hono';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { registerUser, loginUser, AuthError } from '../services/auth.service.js';

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

auth.post('/register', validateBody(registerSchema), async (c) => {
  const body = c.get('validatedBody' as never) as z.infer<typeof registerSchema>;

  try {
    const result = await registerUser(body);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message }, err.statusCode as 400 | 409);
    }
    throw err; 
  }
});

auth.post('/login', validateBody(loginSchema), async (c) => {
  const body = c.get('validatedBody' as never) as z.infer<typeof loginSchema>;

  try {
    const result = await loginUser(body);
    return c.json(result, 200);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message }, err.statusCode as 401);
    }
    throw err;
  }
});

export default auth;