# Backend Global Resources

This file lists the globally available functions, middleware, constants, and assets in the backend project.

## Global Functions

### Utils

- `asyncHandler(fn)`: Wraps async request handlers to catch errors and pass them to next().

- `createError(status, message)`: Creates a standard error object with status code and message.
- `logger`: Structured logger instance using Pino (pretty-printed in dev, JSON in prod).
- `response(res, data, status)`: Sends a standardized JSON response (success based on status < 400).
- `okHtml(res, html, status)`: Sends a response with HTML content type.
- `okFile(res, filePath, status)`: Streams a file to the response.
- `okRaw(res, data, status)`: Sends a raw response without JSON wrapping.
- `getStaticFilePath(fileName)`: Resolves the absolute path to a static asset file.
- `isRecord(value)`: Type guard checking if a value is a non-null object/record.
- `hasString(value, key)`: Type guard checking if a record has a string property.
- `hasNumber(value, key)`: Type guard checking if a record has a number property.
- `isDateRangeQuery(value)`: Guard checking for `startDate` and `endDate` number properties.
- `isStringUnion(value, allowed)`: Guard checking if a string is one of the allowed values.

### Core

- `connectMongo()`: Establishes a connection to MongoDB using env configuration.
- `disconnectMongo()`: Closes the active MongoDB connection.
- `getMongoState()`: Returns the current MongoDB connection state (0=disconnected, 1=connected, etc).
- `setupPlugins(app)`: Applies global middleware (Helmet, CORS, RateLimit, BodyParser, CookieParser) to the Express app.

## Middleware

- `authenticate`: Validates Keycloak JWT, checks expiration, and populates `req.user`.
- `requireRole(role)`: Higher-order middleware that enforces RBAC by checking `req.user.realm_access.roles`.
- `requireAdmin`: Shortcut middleware that enforces the "admin" role.
- `errorHandler`: Global error handler that captures exceptions and sends formatted JSON responses.
- `requestLogger`: Morgan-based request logger (conditional formatting based on env).
- `notFound`: Sends a 404 JSON response for formatted "Resource not found" errors.
- `unsupported`: Sends a 405 Method Not Allowed response.
- `unsupportedRoute`: Catch-all 404 handler for undefined routes.

## Constants

### Configuration (`src/config/env.ts`)

- `env`: Object containing all validated environment variables (Zod parsed).
- `appConfig.isProduction`: `true` if NODE_ENV is "production".
- `appConfig.isStaging`: `true` if NODE_ENV is "staging".
- `appConfig.baseUrl`: The backend's base URL (from env or defaults to localhost).
- `appConfig.features.rateLimit`: Boolean indicating if rate limiting is enabled.

## Assets

- `welcome.html`: HTML template for the root welcome page (`src/assets/html/welcome.html`).

## Global Types

- `src/types/express/index.d.ts`: Global extension for `Express.Request` (adds `req.user`).
- `src/types/`: Directory for shared type definitions.
