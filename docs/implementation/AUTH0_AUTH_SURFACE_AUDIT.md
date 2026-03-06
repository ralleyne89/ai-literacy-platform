# Auth0 Auth Surface Audit

## Purpose

This document inventories the current frontend and backend authentication surface and the remaining Supabase-linked dependencies that still block a clean Auth0 production cutover.

## Current State Summary

- The frontend auth shell is already centered on `Auth0` plus backend session exchange in `src/contexts/AuthContext.jsx` and `src/pages/AuthCallback.jsx`.
- Protected product data in the main app pages is now loaded from Flask APIs with `axios`, not direct browser-side Supabase table reads.
- The backend still exposes its auth boundary through Supabase-named helpers and still carries Supabase-specific secrets, claims, and identity assumptions.
- Billing and webhook/serverless paths still contain direct Supabase dependencies that would break or drift after a full Auth0 cutover.

## Key Findings

### 1. Frontend direct Supabase data reads are no longer the primary blocker

The original cutover plan assumed the dashboard and training pages still depended on direct browser-side Supabase reads. That no longer appears to be true in the current repo state.

- `src/pages/DashboardPage.jsx` loads history, progress, and recommendations from `/api/assessment/history`, `/api/training/progress`, and `/api/assessment/recommendations`.
- `src/pages/TrainingPage.jsx` loads modules and progress from `/api/training/modules` and `/api/training/progress`.
- `src/pages/TrainingModulePage.jsx` loads module details and writes progress through `/api/training/*`.
- `src/pages/AssessmentPage.jsx` uses `/api/assessment/questions` and `/api/assessment/submit`.
- `src/pages/BillingPage.jsx` uses `/api/billing/*`.

Result: the highest-risk runtime blockers are now backend identity/storage and billing/serverless paths, not the three main frontend product pages called out in the plan.

### 2. The frontend still carries dormant Supabase config surface

Supabase is no longer visibly used in the runtime page flows above, but it is still part of the auth/config surface:

- `src/services/supabaseClient.js` still instantiates a Supabase browser client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No active app imports of `src/services/supabaseClient.js` were found during this audit, so it appears to be a leftover dependency rather than a current runtime requirement.
- `src/contexts/AuthContext.jsx` still models auth modes as `auth0`, `backend`, and `supabase`, and keeps Supabase naming in several helper APIs for token/identity handling.
- `.env.example` and `README.md` still describe Supabase mode as a first-class production configuration path.

Result: not an immediate browser data blocker, but still part of the cutover surface and easy to misconfigure during deploys.

## Frontend Auth Paths

### Auth provider and token lifecycle

- `src/App.jsx` wraps the app in `AuthProvider` and registers the Auth0 callback route at `/auth/callback`.
- `src/contexts/AuthContext.jsx` is the single source of truth for auth state.
- On boot, `AuthContext` restores a locally stored backend JWT from `localStorage`, applies it to the global `axios` `Authorization` header, and refreshes the user via `/api/auth/profile`.
- In Auth0 mode, `AuthContext` constructs the Auth0 authorize URL directly, stores PKCE state in `sessionStorage`, and redirects the browser to Auth0.
- After callback, `AuthContext` exchanges the Auth0 credential with Flask at `/api/auth/exchange`, receives a backend JWT, then uses that JWT for all later API calls.

### Login and signup entry points

- `src/pages/LoginPage.jsx`
  - Collects only email.
  - Calls `login(email)` from `useAuth()`.
  - In Auth0 mode, this redirects to Auth0 Universal Login.
  - Social login buttons call `loginWithProvider('google' | 'facebook')`.
- `src/pages/RegisterPage.jsx`
  - Collects only email.
  - Calls `register({ email })` from `useAuth()`.
  - In Auth0 mode, this redirects to Auth0 signup with `screen_hint=signup`.

### Callback handling

- `src/pages/AuthCallback.jsx`
  - Reads `code`, `state`, and fallback token fragments from the callback URL.
  - Verifies PKCE state and code verifier against `sessionStorage`.
  - Calls `syncBackendAfterLogin()` from `AuthContext`.
  - Redirects to `/dashboard` on success or `/login` with structured error state on failure.

### Protected route gating

- `src/components/ProtectedRoute.jsx` blocks unauthenticated access and redirects to `/login`.
- Protected routes currently include:
  - `/training/modules/:moduleId/learn`
  - `/dashboard`
  - `/profile`

### Auth-dependent frontend API consumers

- `src/pages/DashboardPage.jsx`
- `src/pages/TrainingPage.jsx`
- `src/pages/TrainingModulePage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/BillingPage.jsx`
- `src/pages/CertificationPage.jsx`
- `src/pages/AuthCallback.jsx`

All of these rely on the backend JWT placed in `axios.defaults.headers.common.Authorization`.

## Backend Auth Paths

### App bootstrap and JWT configuration

- `backend/app.py`
  - Sets `JWT_SECRET_KEY` from either `SUPABASE_JWT_SECRET` or `JWT_SECRET_KEY`.
  - Loads `AUTH0_DOMAIN` and `AUTH0_AUDIENCE`.
  - Registers auth-sensitive blueprints:
    - `/api/auth`
    - `/api/assessment`
    - `/api/training`
    - `/api/certification`
    - `/api/billing`
    - `/api/course`

### Shared auth boundary

- `backend/routes/__init__.py` defines the shared auth helpers:
  - `_decode_supabase_jwt()`
  - `_decode_auth0_jwt()`
  - `_decode_token_claims()`
  - `get_supabase_identity()`
  - `get_supabase_claims()`
  - `supabase_jwt_required()`

Important behavior:

- Every authenticated route still flows through `supabase_jwt_required()`, even when serving Auth0 users.
- `_decode_token_claims()` tries Supabase HS256 decoding first, then Auth0 RS256/JWKS decoding.
- Normalized user identity is written to `g.current_user_id`.

### Auth routes

- `backend/routes/auth.py`
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/auth/exchange`
  - `/api/auth/profile` `GET`
  - `/api/auth/profile` `PUT`
  - `/api/auth/sync`

Behavior split:

- `register` and `login` issue first-party backend JWTs with `create_access_token(identity=user.id)`.
- `exchange` accepts an Auth0 access token or authorization code, validates it, syncs/creates a local user, and then issues a backend JWT.
- `profile` and `sync` are still guarded with `@supabase_jwt_required()`.

### Feature routes protected by the shared auth decorator

These authenticated routes still depend on the shared Supabase-named auth layer:

- `backend/routes/training.py`
  - `GET /api/training/progress`
  - `POST /api/training/enroll/<module_id>`
  - `PUT /api/training/progress/<module_id>`
- `backend/routes/assessment.py`
  - `POST /api/assessment/submit` with `optional=True`
  - `GET /api/assessment/history`
  - `GET /api/assessment/recommendations`
- `backend/routes/certification.py`
  - `GET /api/certification/available` with `optional=True`
  - `GET /api/certification/earned`
  - `POST /api/certification/apply/<certification_id>`
- `backend/routes/course_content.py`
  - `GET /api/course/modules/<module_id>/lessons`
  - `GET /api/course/lessons/<lesson_id>`
  - `POST /api/course/lessons/<lesson_id>/complete`
  - `PUT /api/course/lessons/<lesson_id>/progress`
- `backend/routes/billing.py`
  - `GET /api/billing/subscription`
  - `POST /api/billing/checkout-session` with `optional=True`
  - `POST /api/billing/customer-portal`

## Direct Supabase Dependencies That Still Block Cutover

### 1. Identity storage is still built around 36-character user IDs

Files:

- `backend/models.py`
- `backend/routes/__init__.py`
- `backend/routes/auth.py`
- `backend/routes/billing.py`
- `backend/routes/certification.py`

Details:

- `User.id` is `db.String(36)`.
- All major user foreign keys (`AssessmentResult.user_id`, `UserProgress.user_id`, `LessonProgress.user_id`, `Certification.user_id`) are also `String(36)`.
- Auth0 `sub` values are typically longer provider-qualified strings such as `auth0|...` or `google-oauth2|...`.
- Instead of storing the raw external subject, `_normalize_user_id()` hashes or truncates long IDs into a UUID-like surrogate.

Why this blocks cutover:

- The app cannot preserve the canonical Auth0 subject as the primary stored identity.
- Identity becomes an implicit derived value instead of an explicit provider subject mapping.
- The same user model is still missing dedicated auth-provider fields such as provider name and external subject.
- Cross-system reconciliation, debugging, and future provider expansion stay brittle until identity is redesigned.

### 2. The shared backend auth contract is still Supabase-shaped

Files:

- `backend/routes/__init__.py`
- `backend/app.py`
- `backend/routes/auth.py`

Details:

- The decorator is still named `supabase_jwt_required()`.
- Claims and request context are still stored under names like `supabase_claims`.
- Backend config still treats `SUPABASE_JWT_SECRET` as a first-class secret for token verification.
- The route layer accepts both Supabase and Auth0 tokens through one compatibility layer instead of a clean provider-agnostic contract.

Why this blocks cutover:

- It keeps the production auth boundary semantically tied to Supabase even when Auth0 is the target source of truth.
- It increases the chance of configuration drift and makes verification rules harder to reason about.
- It encourages new code to keep depending on Supabase-shaped helpers and context names.

### 3. Netlify customer portal still authenticates through Supabase directly

File:

- `netlify/functions/customer-portal.js`

Details:

- Uses `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`.
- Validates the bearer token via `supabase.auth.getUser(accessToken)`.
- Reads `stripe_customer_id` directly from the Supabase `users` table.

Why this blocks cutover:

- An Auth0 access token will not validate through `supabase.auth.getUser`.
- The function depends on Supabase Auth and Supabase user storage instead of the Flask app's canonical user model.
- This path will fail even if the main app has already switched to Auth0 plus backend JWTs.

### 4. Stripe webhook still writes subscription state into Supabase tables

File:

- `netlify/functions/stripe-webhook.js`

Details:

- Uses a Supabase service-role client.
- Finds users by email in the Supabase `users` table.
- Writes `subscription_tier`, `stripe_customer_id`, `stripe_subscription_id`, and `subscription_status` directly to Supabase.

Why this blocks cutover:

- Subscription truth would diverge from the Flask database-backed `User` model.
- Webhook behavior still assumes Supabase is the canonical user store.
- Email-based matching is weaker than using a verified canonical app user record.

### 5. Legacy checkout function still trusts caller-supplied email instead of verified user identity

File:

- `netlify/functions/checkout-session.js`

Details:

- Requires only `plan` and `email` in the request body.
- Accepts `Authorization` in CORS headers but does not validate or use it.
- Creates Stripe sessions solely from caller-supplied email.

Why this blocks cutover:

- It bypasses the app's authenticated identity entirely.
- It allows billing actions to be initiated without tying the checkout session to a verified app user.
- This is a production boundary problem regardless of provider, but it is explicitly incompatible with the desired Auth0-backed canonical identity model.

### 6. Test and configuration surfaces still encode Supabase assumptions

Files:

- `.env.example`
- `README.md`
- `backend/tests/conftest.py`
- `backend/tests/test_billing.py`
- `backend/tests/test_assessment.py`
- `backend/tests/test_certification.py`

Details:

- Test fixtures still mint HS256 tokens using `SUPABASE_JWT_SECRET`.
- Docs still describe Supabase mode as a supported production auth path.
- The environment examples still center Supabase variables and secrets alongside Auth0.

Why this matters:

- These do not block the runtime cutover by themselves, but they will keep generating misleading setup and test expectations until updated.

## What Is Not A Current Blocker

- No active import of `src/services/supabaseClient.js` was found.
- No direct browser-side Supabase table queries were found in the primary app pages currently used for dashboard, training, module detail, assessment, billing, or profile flows.
- The frontend already uses `VITE_API_URL` plus backend `axios` calls for the main authenticated product experience.
- The backend already has working Auth0 token validation logic and a backend token exchange route in place.

## Recommended Cutover Priorities

1. Replace the 36-character user ID assumption with a canonical internal app user ID plus explicit auth-provider subject fields.
2. Rename and refactor the shared auth layer so routes no longer depend on Supabase-shaped helper names or request context.
3. Move Netlify billing/customer portal and webhook identity handling onto the Flask-backed user store, or retire the legacy functions in favor of Flask endpoints.
4. Remove or quarantine dormant Supabase frontend client/config code if `auth0` is the only intended production mode.
5. Update tests and docs so Auth0 plus backend JWT becomes the documented and validated production path.

## Audit Outcome

The main app experience is further along than the original cutover plan implied: browser-side product data already mostly flows through Flask. The remaining production blockers are concentrated in identity modeling, shared token validation semantics, and billing/serverless infrastructure that still depends directly on Supabase Auth and Supabase user tables.
