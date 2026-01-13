import { NextFunction, Request, Response } from "express";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

import { appConfig } from "../config/env";
import { User } from "../modules/user/user.model";
import { createError } from "../utils/error";

// --- Types ---
interface RealmAccess {
  roles: string[];
}

interface ResourceAccess {
  [key: string]: {
    roles: string[];
  };
}

export interface KeycloakUser {
  preferred_username?: string;
  realm_access?: RealmAccess;
  resource_access?: ResourceAccess;
  sub: string;
  [key: string]: any;
}

// --- JWKS Client Setup ---
const client = jwksClient({
  jwksUri: appConfig.env.KEYCLOAK_JWKS_URI,
});

// Function to retrieve the signing key from Keycloak
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// --- Middleware: Verify JWT ---
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(createError(401, "No valid Authorization header provided"));
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return next(createError(401, "Format is Bearer <token>"));
  }
  const token = parts[1] as string;

  const verifyOptions: jwt.VerifyOptions = {
    issuer: appConfig.env.KEYCLOAK_ISSUER,
    ignoreExpiration: false,
  };

  // Only check audience if configured
  if (appConfig.env.KEYCLOAK_AUDIENCE) {
    verifyOptions.audience = appConfig.env.KEYCLOAK_AUDIENCE;
  }

  jwt.verify(
    token,
    getKey,
    verifyOptions,
    (
      err: jwt.VerifyErrors | null,
      decoded: string | jwt.JwtPayload | undefined
    ) => {
      if (err) {
        // Differentiate between expired and invalid
        if (err.name === "TokenExpiredError") {
          return next(createError(401, "Token expired"));
        }
        return next(createError(401, "Invalid token"));
      }

      // Keycloak tokens are JwtPayload objects
      if (!decoded || typeof decoded === "string") {
        return next(createError(401, "Invalid token payload"));
      }

      const keycloakUser = decoded as KeycloakUser;

      // Attempt to link with local DB user
      // Note: This adds a DB call to every authenticated request.
      User.findOne({ keycloakId: keycloakUser.sub })
        .then((user) => {
          if (user) {
            // Merge local user props mainly _id and role
            req.user = {
              ...keycloakUser,
              _id: user._id.toString(), // Ensure string ID for controller compatibility
              // role: user.role, // Optional: sync role?
            };
          } else {
            req.user = keycloakUser;
          }
          next();
        })
        .catch((dbErr) => next(dbErr));
    }
  );
};

// --- Middleware: Require Role (RBAC) ---
// Checks for 'admin' role in realm_access by default, or you can check generic roles
export const requireRole = (role: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !req.user.realm_access?.roles?.includes(role)) {
      return next(createError(403, `Requires ${role} role`));
    }
    next();
  };
};

// Backwards compatibility with existing code or specific helper
export const requireAdmin = requireRole("admin");
