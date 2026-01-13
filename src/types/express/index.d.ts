import { IUser } from "../../modules/user/user.types";

declare global {
  namespace Express {
    interface Request {
      user?: Partial<IUser> | any; // Falling back to any for now to be safe, but ideally just Partial<IUser>
    }
  }
}
