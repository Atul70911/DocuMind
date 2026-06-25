import { Schema, model, Types, HydratedDocument } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = HydratedDocument<IUser>;

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