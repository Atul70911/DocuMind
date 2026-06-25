import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true } 
);

export const User = model<IUser>('User', userSchema);