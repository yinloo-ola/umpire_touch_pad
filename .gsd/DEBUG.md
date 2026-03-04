# Debug Session: Admin Redirection Issue

## Symptom
Accessing `http://localhost:5173/admin` redirects to `http://localhost:5173/`.

**When:** Navigating to `/admin` or any `/admin/*` route.
**Expected:** Show the admin dashboard if logged in as admin, otherwise show login page.
**Actual:** Redirects to the root (`/`) page.

## Evidence
- `router/index.js` contains a guard that redirects to `{ path: '/' }` if `adminStore.role !== 'admin'` for routes starting with `/admin`.
- If the user is logged in as an `umpire`, this is the expected behavior.
- If the user is trying to log in as an `admin` but still gets redirected, there might be a state issue or a session persistence issue.

## Hypotheses

## Resolution

**Root Cause:** 
The user was authenticated as an `umpire`. The `router/index.js` guard was correctly preventing non-admin users from accessing `/admin` routes and redirecting them to `/`. However, there was no way for an umpire to log out and switch to an admin account.

**Fix:**
1. Added a header to `MatchList.vue` with a **Logout** button.
2. Implemented role-based personalized greetings (e.g., "Welcome Admin" vs "Welcome Umpire").
3. Added a conditional **Admin Dashboard** link in the header for users with the `admin` role.

**Verified:**
1. Confirmed that an authenticated `umpire` is redirected to `/` when trying to access `/admin`.
2. Confirmed that clicking "Logout" clears the session and returns to the login page.
3. Confirmed that logging in as `admin` allows access to `/admin/dashboard`.
4. Visual proof captured: `umpire_match_list_with_header_1772641588956.png`.

**Regression Check:**
- All routes are still protected.
- Admin dashboard remains accessible only to admins.
