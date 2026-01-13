import { Types } from "mongoose";

import { createError } from "../../utils/error";

import { Phone, Profile, User } from "./user.model";
import { IAddress, IPhone, IProfile, IUser, UserStatus } from "./user.types";

// ----------------------------------------------------------------------
// User Operations
// ----------------------------------------------------------------------

export const createUser = async (
  userData: Partial<IUser>,
  profileData: Partial<IProfile>,
  phoneData?: Partial<IPhone>
) => {
  const existingUser = await User.findOne({
    $or: [{ email: userData.email }, { keycloakId: userData.keycloakId }],
  });

  if (existingUser) {
    throw createError(
      409,
      "User with this email or Keycloak ID already exists"
    );
  }

  // 1. Create User first to get ID
  const user = new User({
    ...userData,
    status: UserStatus.ACTIVE,
  });
  await user.save();

  // 2. Create Profile
  const profile = new Profile({
    userId: user._id,
    name: profileData.name,
    addresses: profileData.addresses || [],
  });
  await profile.save();

  // 3. Create Phone (if provided)
  let phone;
  if (phoneData) {
    phone = new Phone({
      userId: user._id,
      ...phoneData,
    });
    await phone.save();
  }

  // 4. Update User with linkages
  user.profileId = profile._id as Types.ObjectId;
  if (phone) user.phoneId = phone._id as Types.ObjectId;
  await user.save();

  return { user, profile, phone };
};

export const getUserByKeycloakId = async (keycloakId: string) => {
  return User.findOne({ keycloakId }).populate("profileId").populate("phoneId");
};

export const getUserById = async (userId: string) => {
  return User.findById(userId).populate("profileId").populate("phoneId");
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
  if (!user) throw createError(404, "User not found");
  return user;
};

// ----------------------------------------------------------------------
// Profile Operations
// ----------------------------------------------------------------------

export const getProfile = async (userId: string) => {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw createError(404, "Profile not found");
  return profile;
};

export const updateProfile = async (
  userId: string,
  data: Partial<IProfile>
) => {
  // Prevent updating userId or sensitive fields if any
  const { userId: _, ...updateData } = data;

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true }
  );
  if (!profile) throw createError(404, "Profile not found");
  return profile;
};

// ----------------------------------------------------------------------
// Address Operations
// ----------------------------------------------------------------------

export const addAddress = async (userId: string, address: IAddress) => {
  const profile = await getProfile(userId);

  profile.addresses.push(address);

  await profile.save();
  return profile;
};

export const updateAddressStatus = async (
  userId: string,
  addressId: string,
  isActive: boolean
) => {
  const profile = await getProfile(userId);

  const address = profile.addresses.find(
    (a: any) => a._id.toString() === addressId
  );
  if (!address) throw createError(404, "Address not found");

  address.isActive = isActive;
  await profile.save();
  return profile;
};

export const removeAddress = async (userId: string, addressId: string) => {
  const profile = await getProfile(userId);

  profile.addresses = profile.addresses.filter(
    (a: any) => a._id.toString() !== addressId
  );
  await profile.save();
  return profile;
};

// ----------------------------------------------------------------------
// Phone Operations
// ----------------------------------------------------------------------

export const setPhone = async (userId: string, phoneData: Partial<IPhone>) => {
  // Check if phone exists
  let phone = await Phone.findOne({ userId });

  if (phone) {
    Object.assign(phone, phoneData);
    await phone.save();
  } else {
    phone = new Phone({
      userId,
      ...phoneData,
    });
    await phone.save();

    // Link to user
    await User.findByIdAndUpdate(userId, { phoneId: phone._id });
  }

  return phone;
};
