import { Schema, model, Document, Types } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  teamId: Types.ObjectId;
  role: 'Admin' | 'Member' | 'SalesManager' | 'SalesRep';
  invitedBy: Types.ObjectId;
  token: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Member', 'SalesManager', 'SalesRep'],
      default: 'SalesRep',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined'],
      default: 'Pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
