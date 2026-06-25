import { User } from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'AuthError';
  }
}

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email });

  if (existing) {
    throw new AuthError('An account with this email already exists', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  const token = signToken({ userId: user._id.toString(), email: user.email });

  return {
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name },
  };
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email });

  if (!user) {
    throw new AuthError('Invalid email or password', 401);
  }

  const isValid = await comparePassword(input.password, user.passwordHash);

  if (!isValid) {
    throw new AuthError('Invalid email or password', 401);
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });

  return {
    token,
    user: { id: user._id.toString(), email: user.email, name: user.name },
  };
}