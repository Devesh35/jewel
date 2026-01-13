import { Document, Types } from "mongoose";

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

export interface IAddress {
  addressLine1: string;
  addressLine2?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isActive: boolean;
}

export interface IPhone {
  userId: Types.ObjectId;
  number: string;
  countryCode: string;
  isWhatsappConnected: boolean;
  isWhatsappEnabled: boolean;
  isSmsEnabled: boolean;
}

export interface IProfile {
  userId: Types.ObjectId;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  addresses: IAddress[];
  defaultAddressId?: Types.ObjectId;
}

// User Status Enum
export enum UserStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
  SUSPENDED = "suspended",
  REVIEW = "review",
}

export interface IUser extends Document {
  email: string;
  role: string; // 'customer', 'admin', 'staff', 'guest'
  keycloakId: string;
  authProvider: string; // 'email', 'google', 'phone'
  phoneId?: Types.ObjectId;
  profileId?: Types.ObjectId;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
