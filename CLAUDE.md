# Security Rules for AI-Generated Code

Follow these rules for all code generation, refactoring, and updates in this project. No exceptions.

## 1. Secrets and Environment Variables
- **Never expose secrets in frontend code.**
- Every API key, token, database URL, and private config lives in `.env` files only.
- `.env` files must always be listed in `.gitignore` (specifically `.env`, `.env.local`, `.env.*.local`).
- Frontend code must never contain raw secret values. No `const API_KEY = "sk-..."` in client-side files.
- For Next.js/Vite: only variables prefixed with `NEXT_PUBLIC_` or `VITE_` belong in the frontend, and those must never be secret keys.
- Backend secrets are accessed via environment variables only and are never returned to the client in API responses.
- Maintain a `.env.example` file with all required variable names but empty values.

## 2. Rate Limiting
- Apply rate limiting on all public-facing API routes.
- **Auth endpoints** (login, register, password reset): 5 requests per 15 minutes per IP.
- **General API**: 60 requests per minute per IP.
- **AI/LLM proxy endpoints**: 10 requests per minute per user.
- **File uploads**: 5 requests per minute per IP.
- Always return `429 Too Many Requests` with a `Retry-After` header when limits are hit.
- Show clear rate limit error messages to users.

## 3. Input Validation and Sanitization
- **Validate and sanitize everything on the server.** Client-side validation is only for UX convenience.
- Use schema validation libraries (Zod/Joi for JS/TS, Pydantic for Python).
- Sanitize all string inputs before storing or displaying them to prevent XSS.
- Use parameterized queries or ORM methods. Never interpolate user input into raw SQL or NoSQL queries.
- Validate data type, length limits, allowed characters, required fields, and enum values.
- Reject invalid input with a clear `400 Bad Request` response and log the attempt.

## 4. Authentication and Authorization
- Use established auth libraries (NextAuth.js, Clerk, Supabase Auth, Auth0, Passport.js, lucia-auth).
- Passwords must never be stored in plain text. Use bcrypt (minimum cost 12) or argon2.
- JWTs must be signed with a strong secret stored in env (minimum 32 characters). Set short expiry of 15 to 60 minutes.
- Refresh tokens must be stored in `httpOnly` cookies, not `localStorage`.
- Verify the user identity and their permission to access the resource on every request.
- Implement account lockout after repeated failed login attempts.
- Add explicit role and permission checks on admin routes and sensitive operations.

## 5. SQL and Database Security
- Always use an ORM (Prisma, Drizzle, SQLAlchemy, Mongoose) or parameterized queries.
- Constructing queries via string concatenation with user data is strictly forbidden.
- Apply the principle of least privilege: the database user should only have the permissions it actually needs.
- Never return raw database errors to the client to avoid leaking schema information.

## 6. CORS Configuration
- **Never use wildcard CORS in production.**
- Explicitly whitelist only the origins that should access the API.
- Restrict allowed HTTP methods to only what each endpoint needs.

## 7. HTTP Security Headers
- Always set security headers using helmet or equivalent:
  - `Content-Security-Policy`: restrict script and style sources.
  - `X-Frame-Options: DENY` to prevent clickjacking.
  - `X-Content-Type-Options: nosniff`.
  - `Strict-Transport-Security` to force HTTPS.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
- Remove the `X-Powered-By` header to avoid leaking framework information.

## 8. File Upload Security
- Validate file type by MIME type and extension on the server. Never trust the client.
- Set strict file size limits (e.g., 5MB for images, 25MB for documents).
- Store uploaded files outside the web root or in a cloud bucket (S3, GCS, Cloudinary).
- Never serve user-uploaded files with executable permissions.
- Rename uploaded files to a UUID. Never use the original filename directly.

## 9. Error Handling and Logging
- **Never return internal errors or stack traces to the client.**
- Return generic error messages to users: "Something went wrong" is enough.
- Log errors server-side with full context: timestamp, user ID if available, route, sanitized input.
- Use correct status codes: 4xx for client errors, 5xx for server errors. Do not use 500 for validation failures.

## 10. Dependency Security
- Run audits (`npm audit` or `pip-audit`) regularly. Fix high and critical issues.
- Avoid packages that are unmaintained (no updates in 2+ years).
- Pin dependency versions in production using lockfiles (`package-lock.json` or `requirements.txt`).

## 11. XSS Prevention
- **Never render dynamic user content as raw HTML.**
- Do not use `dangerouslySetInnerHTML` in React unless the content is fully sanitized with DOMPurify.
- Never use `eval()`, `new Function()`, or `innerHTML` with dynamic user content.

## 12. Deployment Checklist
- `.env` is not committed to git.
- All secrets are set in the hosting platform environment variables.
- Debug mode and development logging are off in production.
- Database is not publicly exposed.
- HTTPS is enforced.
- Rate limiting is active on all public endpoints.
- CORS is restricted to known origins.

## AI and LLM-Specific Rules
- Treat LLM inputs and outputs like untrusted data.
- Never send raw user input directly to an LLM. Sanitize it first to prevent prompt injection.
- Always set a `max_tokens` limit on LLM calls.
- Store the API key server-side only. Route all LLM calls through your own backend.
- Log LLM usage (token counts) per user and implement per-user or per-session token budgets to prevent cost attacks.
- Validate and sanitize LLM output before rendering it in the UI (XSS risk).
