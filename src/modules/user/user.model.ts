import mongoose, { Schema } from "mongoose";

import { IAddress, IPhone, IProfile, IUser, UserStatus } from "./user.types";

// ----------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------

const AddressSchema = new Schema<IAddress>({
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const PhoneSchema = new Schema<IPhone>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    number: { type: String, required: true },
    countryCode: { type: String, required: true },
    isWhatsappConnected: { type: Boolean, default: false },
    isWhatsappEnabled: { type: Boolean, default: false },
    isSmsEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: {
      first: { type: String, required: true },
      middle: { type: String },
      last: { type: String, required: true },
    },
    addresses: [AddressSchema],
    defaultAddressId: { type: Schema.Types.ObjectId }, // could ref an _id inside addresses array
  },
  { timestamps: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    role: {
      type: String,
      enum: ["customer", "admin", "staff", "guest"],
      default: "customer",
    },
    keycloakId: { type: String, required: true, unique: true },
    authProvider: { type: String, default: "email" },
    phoneId: { type: Schema.Types.ObjectId, ref: "Phone" },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile" },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

// ----------------------------------------------------------------------
// Models
// ----------------------------------------------------------------------

export const Phone = mongoose.model<IPhone>("Phone", PhoneSchema);
export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);
export const User = mongoose.model<IUser>("User", UserSchema);
