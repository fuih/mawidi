# Mawidi — Security, Logic & Production Readiness Audit

> Audit performed on 2026-06-16 covering the full Mawidi (formerly Tabibak) codebase:
> FastAPI backend, React/Vite frontend, PostgreSQL schema, Alembic migrations.

---

## TL;DR — Top 10 Issues Ranked

### Fix this week (blocking, must resolve before any real doctor/patient uses the platform)

1. **`is_verified` is never enforced server-side.** A freshly-registered doctor can log in, configure their profile, and use the dashboard before admin approves them. The user said this should return 403 — it doesn't. The search filter and the frontend banner are the only places `is_verified` is read. (`auth_service.py:106`, `dependencies.py:38-79`).
2. **Patient cancellation is gated by the appointment UUID alone — no proof of identity.** The cancel route is `PATCH /api/v1/appointments/guest/{appointment_id}/cancel` with zero challenge. The "cancellation token" is the appointment's own UUID, which is sent in cleartext in the SMS, the email, the browser history, and the referer header. Anyone with the link cancels; the link is also the key to read the full appointment (name + phone). (`appointments.py:80-96`, `appointment_service.py:1095-1165`, `sms_service.py:92`).
3. **The migration `a1b2c3d4e5f6_add_queue_booking_mode.py` uses `sqlite_where=` instead of `postgresql_where=`** for the partial unique indexes. The project runs on PostgreSQL; on PG, the keyword is silently ignored, so the indexes aren't partial. They happen to behave correctly *by accident* (the indexed column is NULL in the wrong-mode rows, which is the same effect). It's a latent landmine: any future migration adding a new non-partial unique constraint in this style will look correct in code and silently fail in production. Fix it now before someone copies the pattern.
4. **Duplicate `GET /dashboard/stats` route — second definition references a function that doesn't exist** (`appointment_service.get_appointment_stats`). The first definition is shadowed, the second is broken. Either delete line 238, or implement the missing service function. (`dashboard.py:132` and `dashboard.py:238`).
5. **Queue number race condition: `SELECT count(*) ... FOR UPDATE` does not lock the rows the next insert needs.** `with_for_update()` on a `count(*)` aggregate locks the rows scanned during the count, but only for the duration of the *current* statement — both concurrent transactions can see the same count and attempt to insert the same `queue_number`. The unique index `uq_appt_queue_number` does catch the duplicate at commit time and the code surfaces a "please retry" error to the user. So the *integrity* is preserved, but the *user experience* is broken (lost booking under contention). The user asked me to grep explicitly for the count-then-insert anti-pattern: **it's there, and `FOR UPDATE` doesn't save it.** Fix: use a Postgres `SEQUENCE` per (doctor, date), or an advisory lock, or `INSERT ... SELECT count+1 ... RETURNING queue_number` inside the same transaction. (`appointment_service.py:181-189`).
6. **File upload accepts HTML and SVG content and serves it back unsanitized.** `storage_service.py` validates the `Content-Type` header from the client (trivially spoofable) but **never inspects the file content**. A doctor can upload `evil.html` with `Content-Type: image/jpeg`; the file is saved with the original `.html` extension; FastAPI's `StaticFiles` mount serves it as `text/html`. **Stored XSS** on the doctor's public profile — patient views the photo, JS runs in patient's browser, steals their booking details and JWTs from `localStorage`. (`storage_service.py:17,38-60`, `main.py:43`).

### Fix before public launch (important but not immediately blocking)

7. **No rate limiting on login, registration, booking, or guest cancellation.** Combined with phone-number-as-username for patients and weak password discipline, this is a credential-stuffing and account-takeover risk. Add at least a per-IP rate limit on auth and on `POST /appointments/book`. (Cross-cutting — no `slowapi` or equivalent in `requirements.txt`).
8. **Hardcoded `http://localhost:5173` URLs in every email and SMS template.** Every verification, password-reset, doctor-approval, and cancellation link points to localhost. In production, patients receive broken links and cannot reset passwords. This is a launch blocker *for the password-reset and verification flows specifically*. Centralize the frontend URL in `settings.FRONTEND_URL` and interpolate. (`email_service.py:69,144,222`; `sms_service.py:64,91`).
9. **JWT access and refresh tokens are stored in `localStorage`** (authStore.ts). One stored XSS (see #6) and the attacker owns every logged-in doctor's or patient's account for the 7-day refresh window. Move to `httpOnly; Secure; SameSite=Strict` cookies, with a CSRF token for state-changing requests, or use a BFF pattern. (`authStore.ts:25-26,32-33`).
10. **`password_reset_token` is bcrypt-hashed.** bcrypt truncates input to 72 bytes, has a high work factor by design, and the input here is a JWT (~200+ bytes). The stored hash is the hash of the first 72 bytes of the token; verification hashes the first 72 bytes of the supplied token. The two truncate consistently, so it "works" for the verify step — but the design is wrong (use `hashlib.sha256(token_bytes).hexdigest()`), and if anyone ever shortens or lengthens the token format, this will silently break. More importantly: if the same doctor triggers two resets back-to-back and the first 72 bytes of both JWTs happen to share a prefix, the hashes will match. (Low probability, but it's the kind of bug a security audit exists to find.) Use SHA-256. (`password_reset.py:47,74,103`).

### Fix before scaling past 100 doctors (can wait for traction)

- `appointment_service.py` is 1,165 lines and mixes query building, business rules, response shaping, and notification dispatch. Split into `booking_service.py`, `query_service.py`, `status_service.py`, `notification_dispatcher.py`.
- No automated tests at all. The race condition in #5 was only catchable by reading the code; with even a single integration test that fires two concurrent `POST /appointments/book` requests, this would have been caught at v0.1.
- `SECRET_KEY` defaults to `"change-me-in-production"`. `config.py` does not refuse to start when this default is in use — there is no startup check. Add a Pydantic validator that raises on import if the default is in use *and* `ENV=production`.
- CORS allowlist is `["http://localhost:5173"]`. No production origins.
- `smtplib` is synchronous and dispatched via `BackgroundTasks`. Fine at 100 doctors; will need an async SMTP client or a dedicated worker (Celery/RQ) at scale.
- `SECRET_KEY` is shared across access/refresh/email-verify/password-reset token types, distinguished only by a `type` claim. A leak of one token's signing key compromises all of them.
- Patient `phone` column is not unique (intentional for shared phones, but `authenticate_patient` does `select(Patient).where(Patient.phone == phone)` which can return the wrong patient if duplicates exist).

---

## A. Security Audit

### A.1 Authentication

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| S-A1 | CRITICAL | **Doctor verification is not enforced on login or on dashboard access.** `is_verified` is never checked by `authenticate_doctor` or by `get_current_clinic_user`. A doctor who registered but was rejected by admin can still log in, change their profile, view appointments, etc. The frontend shows a banner; the backend does nothing. This contradicts the documented behavior. | `auth_service.py:95-128`; `dependencies.py:97-147` |
| S-A2 | HIGH | **`SECRET_KEY` has no production guard.** `config.py:20-22` defaults to `"change-me-in-production"` with no validator. The Pydantic settings class happily starts the app with the default value. In production, the absence of `.env` or a misconfigured deployment silently uses the known-public default — anyone who can read the source can sign valid tokens. | `config.py:20` |
| S-A3 | HIGH | **Refresh tokens are not stored server-side; no revocation path exists.** The user explicitly asked for a concrete evaluation. Concrete consequences: a fired assistant's 7-day refresh token remains valid; a doctor's stolen laptop's 7-day refresh remains valid; the only recourse is to wait for expiry or rotate `SECRET_KEY` (which logs everyone out — including legitimate users — and requires the team to deploy). For a single-founder team with 50–100 doctors, the realistic risk is: a fired secretary/assistant logs in 24 hours later and silently deletes the day's appointments, or a stolen doctor laptop lets the thief read patient phone numbers for a week. **Recommendation**: add a minimal `revoked_tokens` table keyed by `jti` (token id) or by `user_id + token_type`, and check it on the `/auth/refresh` endpoint and on assistant-bound dashboard calls. A full revocation list is overkill for v1; a per-user "force logout all" admin endpoint and a revocation check on refresh is the minimum bar. | `security.py:49-58`; `auth_service.py:209-253` |
| S-A4 | HIGH | **Password reset token hashed with bcrypt.** bcrypt's 72-byte truncation + slow work factor is the wrong tool for token hashing. Works in practice only because both sides truncate consistently. Use `hashlib.sha256(token.encode()).hexdigest()`. Also, the raw token is printed to stdout in the email-service mock fallback (email_service.py:158, sms_service.py:65), so if SMTP ever fails and the fallback activates in production, reset tokens end up in container logs. | `password_reset.py:47,74,103`; `email_service.py:158`; `sms_service.py:65` |
| S-A5 | HIGH | **JWTs in `localStorage`.** Standard XSS-fuelled account-takeover vector. A stored XSS (see A.6) exfiltrates both `access_token` and `refresh_token` from `localStorage`, giving the attacker a 7-day persistent session for the victim doctor. The `axios` interceptor attaches the token automatically, so the attacker doesn't even need to call the API. | `authStore.ts:25-26,32-33` |
| S-A6 | MEDIUM | **Phone-number-as-username is low-entropy.** Algerian mobile numbers follow `0[567]XXXXXXXX` (10 digits, ~30M active). With no rate limiting, credential stuffing on the patient login endpoint is feasible if any patient password is leaked from another breach. (Phone is also not unique on the `patients` table — `authenticate_patient` does `where(Patient.phone == phone)` and returns `scalar_one_or_none()`, which fails if there are two patients with the same phone.) | `patient.py:36`; `auth_service.py:185-204` |
| S-A7 | MEDIUM | **Email verification uses GET with the token in the URL.** The verification link is logged in browser history, server access logs, and reverse-proxy logs. The `Referer` header can leak it to any external resource loaded on the post-verification page. Use a POST endpoint with the token in the body. (Same applies to password reset — the reset page is GET, the API call is POST, but the token is in the URL fragment of the reset email, which leaks via referer to anyone rendering an external resource on the post-reset page.) | `auth.py:97-119`; `email_service.py:69-70,144-145` |
| S-A8 | MEDIUM | **`get_current_clinic_user` returns a `Doctor` object for both doctor and assistant tokens.** Any code path that uses this dependency and then calls e.g. `current_doctor.assistants` or `current_doctor.profile_photo_url` works correctly. But there is no way for the doctor (or the audit log, which doesn't exist) to know *who* — doctor or assistant — performed a given action. The assistant inherits the doctor's full permissions including the manual-book endpoint, settings changes, and assistant CRUD. No role distinction means no accountability. | `dependencies.py:97-147`; `dashboard.py:301-327` |
| S-A9 | MEDIUM | **`authenticate_doctor` falls back to assistant lookup on miss, with no delay.** A timing attack can distinguish "doctor email exists, wrong password" from "no doctor email, fall through to assistant lookup, then no match" from "no doctor, no assistant, both lookups miss". Brute-forcing a known doctor email is a constant-time operation; brute-forcing a non-doctor email involves an extra DB roundtrip. Sub-millisecond, but measurable. | `auth_service.py:95-128` |
| S-A10 | LOW | **`verify_token` returns `None` on invalid; depends on caller to handle.** Multiple call sites use this correctly, but it's a footgun. Consider raising instead. | `security.py:61-74` |

### A.2 Authorization (cross-doctor data leakage)

I traced every appointment-reading query in the codebase for missing `doctor_id` filters. The result is **mostly clean — better than I expected for an MVP**:

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| S-B1 | NONE / OK | `appointment_service.get_today_appointments` (line 421-431) correctly scopes `patient_stats` by `Appointment.doctor_id == doctor_id`. **A patient with 5 no-shows at Doctor A does not have those no-shows visible to Doctor B.** This was the user's specific concern. ✓ | `appointment_service.py:421-431` |
| S-B2 | NONE / OK | `appointment_service.get_patient_appointments` (line 821-877) returns appointments for a single `patient_id` across all doctors — but this is the *patient*'s view, not a doctor's. The patient correctly sees their full cross-doctor history. The auto-link-on-fetch logic (line 870-875) attaches guest appointments to the patient account — correct, but worth noting: this means once a patient logs in once, all their guest appointments across all doctors get linked to their account, even those made before they registered. | `appointment_service.py:821-877` |
| S-B3 | LOW | `appointment_service.get_analytics_stats` (line 688-819) is correctly scoped by `doctor_id`. ✓ | `appointment_service.py:688` |
| S-B4 | LOW | `appointment_service.guest_get_appointment` and `guest_cancel_appointment` accept the appointment UUID with **no doctor scoping at all** — but they only return/modify a single appointment, not a list. So the worst case is "you can read/cancel *one specific* appointment if you have its UUID" — which is the cancel-token-by-UUID design, not a multi-doctor leak. (See A.6 for the token problem.) | `appointment_service.py:1095-1165` |
| S-B5 | LOW | The `dashboard/appointments/{id}/status` and `reschedule` routes use `get_current_clinic_user` and then pass `current_doctor.id` as the doctor filter. An assistant with token type="assistant" gets `current_doctor` = the doctor they work for. So an assistant can only modify appointments belonging to their doctor. ✓ | `dashboard.py:145-186` |

**Conclusion on cross-doctor data leakage: the data layer is correctly scoped.** The booking flow's anti-spam check is also correctly scoped (per-doctor per-phone). The `get_today_appointments` patient-stats query that the user asked me to verify explicitly **does not leak across doctors** — line 426 has `Appointment.doctor_id == doctor_id` in the inner stats query.

### A.3 Input validation & injection

| ID | Severity | Finding |
|----|----------|---------|
| S-C1 | LOW | **SQL injection**: All queries use SQLAlchemy parameterized expressions (`select(...).where(...)`). No string-formatted SQL anywhere I found. ✓ |
| S-C2 | MEDIUM | **Stored XSS via profile photo upload** (see #6 in TL;DR). The file extension is preserved from the user's `file.filename`, the content is never inspected, and the file is served as a static file. A doctor uploads `evil.html` claiming `Content-Type: image/jpeg`; the file is saved as `doctorid_uuid.html`; FastAPI's `StaticFiles` serves it as `text/html` because of the `.html` extension. A patient clicking the profile photo URL runs arbitrary JS in the doctor's session context — except worse, it runs in *the patient's* session context, and the patient has no tokens to steal, so the attack is against other doctors and admins who view the doctor's profile in the admin panel. **Fix**: validate content with `python-magic` (libmagic) on the first 4KB, ignore the `Content-Type` header, force a safe extension (`.jpg` always), and serve uploads from a different origin (e.g., `cdn.mawidi.dz`) or with `Content-Disposition: attachment` and `Content-Security-Policy: default-src 'none'`. | `storage_service.py:17,38-60` |
| S-C3 | MEDIUM | **SVG upload not blocked.** Even with content inspection, SVG can contain `<script>` tags. Add `image/svg+xml` to the denied list. |
| S-C4 | MEDIUM | **Slug generation is not atomic.** `register_doctor` does `SELECT WHERE slug = X` then `INSERT` in two queries (auth_service.py:55-60). Two concurrent registrations of "Dr. Ahmed Benali" both see the slug is free, both insert with the same slug, one wins on the unique constraint, the other gets a 500 IntegrityError. The IntegrityError is caught (line 81) but the user sees a generic "email already exists" message. Use a DB-side default + retry, or accept the race. | `auth_service.py:55-60` |
| S-C5 | LOW | **Pydantic patterns are tight.** Phone regex enforces Algerian mobile, name regex is Latin + Arabic + space/hyphen/apostrophe, password min 8, email is `EmailStr`. ✓ |
| S-C6 | LOW | **`notes` field on Appointment is an unrestricted `Text` column.** No current UI exposes it, but a determined doctor could call the API directly and write arbitrary text. Per the user's scope boundary, the field is intended for doctor-internal booking notes (e.g. "patient mentioned allergy X") and not for clinical data. The name is ambiguous — recommend renaming to `internal_notes` or `booking_notes` to make the scope explicit. The same field also has no access control: a registered patient viewing their own appointment can see the doctor's notes if the field is ever exposed in `AppointmentResponse`. | `appointment.py:105` |

### A.4 CORS and CSRF

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| S-D1 | MEDIUM | **CORS allows `http://localhost:5173` only.** No production origin configured. Pydantic's `list[str]` field with no env-var binding means changing the origin requires code change. Bind to `CORS_ORIGINS` env var (already named correctly) but document the expected value. | `config.py:28` |
| S-D2 | MEDIUM | **No CSRF protection on state-changing endpoints.** Because JWT is in `Authorization: Bearer` and there's no cookie, the standard CSRF attack (force a logged-in user's browser to issue a request) doesn't apply. **However**, if you adopt the cookie-based token storage recommended in S-A5, you will need a CSRF token (double-submit cookie pattern) or `SameSite=Strict` cookies for all state-changing endpoints. Plan for this before the cookie migration. |
| S-D3 | LOW | **CORS is set to `allow_credentials=True, allow_origins=[...]`, `allow_methods=["*"], allow_headers=["*"]`.** `allow_origins=[...]` cannot be `["*"]` when credentials are enabled (FastAPI rejects), so the explicit list is correct. The wildcard on methods/headers is overly permissive. Restrict to `["GET", "POST", "PUT", "PATCH", "DELETE"]` and `["Authorization", "Content-Type"]`. | `main.py:28-34` |

### A.5 File uploads

Covered in S-C2/S-C3 above. Additional points:

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| S-E1 | MEDIUM | **Filename is preserved.** A doctor uploads `../../etc/passwd.html`. Path traversal? `Path(file.filename).suffix` extracts only the extension; the rest of the filename is replaced with `f"{doctor_id}_{uuid.uuid4().hex}{ext}"`. So traversal is mitigated. But the extension is taken raw — `.php`, `.jsp`, `.cgi` all pass the MIME check (which only looks at the header) and are served as `text/html` if the content is HTML. | `storage_service.py:38` |
| S-E2 | LOW | **4MB limit is reasonable for a profile photo.** ✓ But there is no per-doctor storage quota — a determined attacker can fill the disk by registering many doctors. With 50–100 doctors and 4MB each, this is fine. With 10,000 doctors, ~40GB of upload storage, with no cleanup for deleted doctors (the file is deleted only when *replaced* via the upload flow — a doctor deletion cascade in the DB does not trigger file cleanup). | `storage_service.py:25-30` |
| S-E3 | LOW | **No virus scan.** Out of scope for an MVP at this scale. Document it. |

### A.6 Cancellation token security (the user's specific question)

The user asked: "since patients book primarily as guests, check whether anyone can view, modify, or cancel another patient's appointment by simply submitting that patient's name and phone number, without proving they are that person."

**The answer is worse than the question anticipated.** The system does not require name+phone challenge for cancellation. It does not require *any* challenge beyond possessing the URL. The "token" is the appointment's own UUID.

| Aspect | Status | Notes |
|--------|--------|-------|
| Token entropy | ✓ | `uuid.uuid4()` = 122 bits, cryptographically secure. Brute force infeasible at internet scale. |
| Token in URL vs body | ⚠ | In URL: leaks via referer, browser history, server access logs, reverse-proxy logs. |
| Token sent in SMS | ✗ | The full cancel URL `…/cancel-appointment/{appointment_id}` is sent in the SMS body. Anyone with read access to the SMS (forwarded SMS, leaked phone, carrier log) can cancel. |
| Token in email | ✗ | Same — the cancel page is reachable via the appointment UUID directly; the SMS includes the link. |
| Rate limiting on `/guest/{id}/cancel` | ✗ | None. Combined with the fact that a brute-forceable endpoint can leak the *full appointment object* (name, phone, doctor, date, time) via `GET /guest/{id}`, the no-rate-limit on the GET is the bigger problem. |
| Patient-side "name + phone" challenge | ✗ | **Not implemented.** The cancel page shows the appointment but does not require the patient to re-enter their name and phone. The URL alone is sufficient. |
| Brute force feasibility | Impractical | 2^122 attempts needed on average. Not the attack vector. |
| Forwarded link attack | Practical | A patient's WhatsApp screenshot, a forwarded SMS, or a leaked screenshot of the cancel page (which shows the cancel button) is sufficient. |
| Mitigations | **None** | See recommendations. |

**Recommendations (ranked by effort/impact)**:

1. **Add a per-IP and per-appointmentId rate limit on `/appointments/guest/{id}` and `/appointments/guest/{id}/cancel`** — at most 5 attempts per IP per hour on the cancel endpoint. This blocks bulk enumeration if any future bug leaks UUIDs.
2. **Generate a separate, opaque, single-use cancellation token** stored in the `appointments` table (e.g., `cancellation_token = Column(String(64), unique=True, index=True)`), embedded in the URL as `/cancel-appointment/{cancellation_token}` (not the appointment UUID), and **cleared on use**. This is a 1-day change.
3. **Add a name+phone challenge to the cancel page.** The cancel page already fetches the appointment; add an inline form requiring the patient to re-enter their phone number. On submit, compare to `appointment.patient_phone`. The phone number is already in the appointment object that the cancel page just fetched, so this is a UX check, not a security check — but it raises the bar for "casual screenshot attacks". For a real security upgrade, send a 6-digit OTP to the patient's phone via Sobersys.
4. **Don't include the cancel URL in the SMS at all.** Send a short code (e.g., last 6 chars of the cancellation token) instead, and have the cancel page accept either the full token or the short code + phone OTP.

**Acceptable-for-v1 stance**: with UUID entropy, the brute-force risk is negligible. The realistic risk is *link forwarding*. If the team decides "the link is the credential" is an acceptable model for guest patients (a deliberate trade-off — guests have no login, so the link *is* their login), document this in the privacy policy and add a 24-hour expiry on cancellation tokens. Otherwise, add (2) or (3) above before public launch.

### A.7 OWASP Top 10 summary

| Category | Status | Notes |
|----------|--------|-------|
| A01 Broken Access Control | ✗ | #1, #2, A.6 |
| A02 Cryptographic Failures | ⚠ | SECRET_KEY default (S-A2), bcrypt on token (S-A4), JWT in localStorage (S-A5) |
| A03 Injection | ✓ | All parameterized |
| A04 Insecure Design | ⚠ | Cancellation-by-URL is a design choice; no defense in depth |
| A05 Security Misconfiguration | ✗ | SECRET_KEY default, CORS localhost, no HTTPS, no security headers |
| A06 Vulnerable Components | Unknown | No `pip-audit` / `npm audit` in CI; `python-jose` had CVEs in older versions |
| A07 Identification & Auth Failures | ✗ | #1 (verification), #2 (token storage) |
| A08 Software & Data Integrity | ✗ | No SRI on frontend assets, no signed URLs on uploads |
| A09 Logging & Monitoring | ✗ | No real logging; only `print()` and basic `logging.info()` |
| A10 SSRF | ✓ | No URL fetching from user input that I found |

---

## B. Logic Bugs & Edge Cases

### B.1 Race conditions

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| L-A1 | CRITICAL | **Queue number race condition (the user's specific question).** `appointment_service.py:181-189` uses `select(func.count(Appointment.id))...with_for_update()` to compute `next_queue_number = count + 1`. This pattern is **broken for queue number assignment** in three ways: (1) `with_for_update()` on a `count(*)` aggregate locks the rows *scanned by the aggregate* for the duration of *that statement*, not the rows that the next `INSERT` will touch. By the time the next `INSERT` happens, the lock is released. (2) Two concurrent transactions `A` and `B` can both observe `count = 5` and both attempt to `INSERT` with `queue_number = 6`. (3) The unique index `uq_appt_queue_number` catches the duplicate at commit time and the code raises a 409 asking the user to retry, so *data integrity is preserved* but *user experience is broken*: a popular doctor's queue link shared on WhatsApp causes a 50% booking-failure rate under concurrent load. **Fix options**: (a) a Postgres sequence with `nextval()` is true atomicity, but the sequence value needs to be bounded to `count + 1` for the same date — use a per-(doctor_id, date) sequence or a per-day advisory lock `pg_advisory_xact_lock(hashtext(doctor_id || date))` around the count+insert. (b) Move the count into the INSERT itself: `INSERT ... SELECT ... FROM appointments WHERE doctor_id = X AND date = Y ... RETURNING queue_number` — single statement, atomic. (c) Use `pg_advisory_xact_lock` to serialize queue-number assignment per (doctor, date). The current `with_for_update()` reads as if it does this but it does not. | `appointment_service.py:181-189` (and same pattern in `reschedule_appointment` at line 633-640) |
| L-A2 | HIGH | **Anti-spam check is racy.** "One active appointment per phone per doctor per day" is enforced by a SELECT-then-INSERT (lines 127-151). Two concurrent guest bookings from the same phone for the same doctor can both pass the check before either INSERTs. The unique indexes don't prevent this (they only prevent double-booking the *same time slot* or the *same queue number* — different queue numbers for the same patient on the same day are allowed by the schema). A determined or buggy client can book queue number 1, 2, 3, 4, 5... in parallel for the same phone. This is also a "patient can spam-book and then not show up, blocking other patients" vector. **Fix**: add a partial unique index `CREATE UNIQUE INDEX uq_active_appointment_per_phone_per_doctor ON appointments(doctor_id, patient_phone) WHERE status IN ('pending', 'confirmed') AND appointment_date = CURRENT_DATE` — but this is current-date only. For a multi-day window, the check has to stay in code; wrap it in `SELECT ... FOR UPDATE` on the doctor's row, or use a `pg_advisory_xact_lock(hashtext(doctor_id))` for serialization. | `appointment_service.py:127-151` |
| L-A3 | HIGH | **Time-based double-booking under concurrency.** Two concurrent POSTs for the same `(doctor, date, time)` will both pass the time-availability check, both attempt INSERT, and exactly one will succeed (the unique index catches it). The other gets the "please retry" IntegrityError. Same UX problem as the queue race. The fix is structural: catch the IntegrityError at the SQLAlchemy layer, retry the SELECT to fetch the booked slot, and return a clear 409. (The code does this in `appointments.py:46-48` — good — but the error message says "this time slot has just been booked" which is fine.) | `appointments.py:40-48`; `appointment_service.py:310-319` |
| L-A4 | MEDIUM | **`reschedule_appointment` (doctor-side) does not wrap the COMMIT in IntegrityError handling.** If the reschedule target slot is already taken, the commit will fail with a unique violation and the user gets a 500. `patient_reschedule_appointment` does handle it (line 1046-1050). Inconsistent. | `appointment_service.py:670-685` (missing) vs `1046-1050` (present) |
| L-A5 | MEDIUM | **Slug generation is not atomic** (also S-C4). Two concurrent registrations of "Dr. A. B." both pass the existence check, both INSERT, one fails IntegrityError. The handler then says "email already exists" which is misleading. | `auth_service.py:55-60` |
| L-A6 | MEDIUM | **Doctor's `working-hours` PUT is a delete-then-insert in two non-atomic operations.** Lines 211-229 in `dashboard.py`: delete all existing hours, flush, then add new ones. If the request fails between the flush and the commit, the doctor is left with no working hours. Wrap in a single transaction (the existing `await db.commit()` does this — the `flush()` in the middle is the issue, because it sends DELETE to the DB but the INSERT and COMMIT happen after. If the process crashes between flush and commit, the deletes are committed and the inserts are not. Use `db.execute(delete(...))` inside a `BEGIN ... COMMIT` block, or use `savepoints`. | `dashboard.py:200-235` |

### B.2 Time and date handling

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| L-B1 | HIGH | **Inconsistent timezone arithmetic.** The booking flow uses `datetime.now(timezone(timedelta(hours=1)))` (Algeria local) for "today" and "past" checks. The analytics endpoint uses `datetime.now(timezone.utc).date()` for "today" (line 399, 721). Between 00:00 and 01:00 local Algeria time (i.e., 23:00–00:00 UTC the previous day), a doctor in Algiers is already on "tomorrow" but the analytics "today" is still "yesterday" in UTC. Booking and analytics disagree on what "today" means. **Fix**: always use a single canonical "today" function — `today_algeria() = datetime.now(ALGERIA_TZ).date()` — and use it everywhere. | `appointment_service.py:119, 399, 721` |
| L-B2 | MEDIUM | **DST is correctly not assumed** (Algeria has not observed DST since 1981 and the code uses a fixed `timedelta(hours=1)`). If Algeria ever re-introduces DST, every "past" check in the codebase breaks silently. Use `zoneinfo.ZoneInfo("Africa/Algiers")` instead of `timezone(timedelta(hours=1))`. | `appointment_service.py:119, 200, 290, 607, 905, 970`; `dashboard.py:283, 336` |
| L-B3 | MEDIUM | **`slot_service` does not consider the doctor's `is_verified` flag** (line 56). An unverified doctor's profile is excluded from search (search.py:22) but `get_available_slots` does not check. A patient who has the direct link can still see and book an unverified doctor. Consistent with A.1's "verification is not enforced" finding, but worth noting separately for the booking flow. | `slot_service.py:55-64` |
| L-B4 | MEDIUM | **`slot_service` does not check `doctor.is_active`** either (same as L-B3). A deactivated doctor is still bookable if the patient has the slug. | `slot_service.py:55-64` |
| L-B5 | LOW | **`slot_service` filter `slot_time in booked_times` uses a `set[time]`.** Two appointments at the same time for the same doctor on the same date is prevented by the unique index, so this is correct. But the set is built from `row[0]` of a SELECT — the set construction has no defensive check that exactly one row was returned per time. If the unique index is ever removed, the dedup is silent. Add an `assert len(rows) == len(set)` in test, not in code. | `slot_service.py:104` |
| L-B6 | LOW | **Slot generation edge case: working hours with start == end.** `current + duration <= end_minutes` is false immediately, returns empty slots. OK. Working hours with `end_time < start_time` is not validated in `WorkingHoursCreate` (Pydantic schema doesn't check). Doctor could save 14:00-09:00 and the slot endpoint would silently return nothing. Add a `start_time < end_time` validator. | `working_hours.py:11-19` |
| L-B7 | LOW | **Slot generation does not handle overnight working hours.** A night-shift doctor with 22:00-02:00 would generate slots 22:00, 22:30, 23:00, 23:30, 00:00, 00:30, 01:00, 01:30 — but the booking validation `appointment_time < working_hours.start_time` would reject anything before 22:00. So the morning slots 00:00, 00:30, 01:00, 01:30 are bookable but conceptually they're "the next day" in the local calendar. The slot service uses `target_date` as the date for the slot set, so all 8 slots show up under the start date, which is wrong for the 4 morning slots. Edge case, but if any doctor needs night hours, this needs an explicit "wraps midnight" flag. | `slot_service.py:79-90` |
| L-B8 | LOW | **Mode-transition edge case.** A doctor switches from time-based to queue-based globally. A specific date has only *cancelled* appointments (the previous day was full, doctor cancelled everything, then switched). The "first existing" check on line 167-171 of `appointment_service.py` finds a cancelled row, sees `queue_number is None` (because it was time-based), inherits `time_based` mode. The doctor wanted queue mode. Fix: filter out cancelled rows in the mode-inheritance check. | `appointment_service.py:167-171, 625-628` |

### B.3 Frontend bugs

| ID | Severity | Finding | Where |
|----|----------|---------|-------|
| L-C1 | MEDIUM | **`CancelAppointmentPage` does not check `isAlreadyCancelled` before calling the cancel API.** If the page is opened in two browser tabs, both tabs can show the cancel button, both click it, and the second one gets a 400. The page handles 400, so no crash, but the UX is confusing. | `CancelAppointmentPage.tsx:96` |
| L-C2 | MEDIUM | **The `axios` interceptor on 401 calls `window.location.href = "/login"` even for guest users.** A guest browsing the doctor profile who hits a 401 (e.g., trying `/auth/patient/me` when not logged in — but wait, the auth router returns 401 only if `auto_error=True`, and `get_optional_patient` uses `auto_error=False`. So this is OK. But the interceptor's 401 handler does run on any 401, including transient ones, and redirects to `/login`. A doctor's dashboard call that 401s for any reason (e.g., a bug in `get_current_clinic_user`) hard-logs them out. | `api.ts:48-103` |
| L-C3 | MEDIUM | **Token refresh sends the refresh token in the URL query string** (line 66: `axios.post(...refresh?refresh_token=${refreshToken})`). Tokens in URLs end up in browser history, server logs, proxy logs, and `Referer` headers. Move to a POST body or a header. | `api.ts:66` |
| L-C4 | LOW | **`isRefreshing` is module-level state.** Two simultaneous 401s on the same module instance work correctly (one triggers refresh, others queue). But if HMR or some bundler edge case creates a new module instance, the state can desync. Low impact in production. | `api.ts:28` |
| L-C5 | LOW | **No request cancellation on logout.** If the user logs out while a request is in flight, the in-flight request can complete and update state. Minor. |
| L-C6 | LOW | **`DashboardLayout.tsx` has a typo in French at line 96:** `{profile?.speciality?.name || "Médecin"}` — `speciality` (English) instead of `specialty` (which the API returns). Renders as "undefined" or the fallback. Cosmetic. | `DashboardLayout.tsx:96` |

---

## C. Production Readiness

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| P-1 | CRITICAL | **No HTTPS.** All traffic is HTTP. Passwords, JWTs, PII all sent in cleartext. | Front with nginx/Caddy, Let's Encrypt, force HTTPS redirect. Block port 80. |
| P-2 | CRITICAL | **`SECRET_KEY` default not validated** (also S-A2). | Add Pydantic validator in `Settings` that raises if `SECRET_KEY == "change-me-in-production"` and `ENV == "production"`. |
| P-3 | HIGH | **No DB backups configured.** `docker-compose.yml` defines a `pgdata` volume but no backup job. | Add `pg_dump` cron, or a managed Postgres (Supabase, Neon, RDS) with point-in-time recovery. |
| P-4 | HIGH | **No connection pool tuning.** `db/session.py:11-14` sets `pool_size=20, max_overflow=10` for PG — that's 30 concurrent connections. For a single uvicorn worker, that's fine. With `uvicorn --workers 4` (recommended for production), you have 120 connections. Postgres default `max_connections=100`. **Tune**: 4 workers × 15 pool = 60, well under the limit. | Document and tune. |
| P-5 | HIGH | **No process manager.** `run_backend.bat` is `uvicorn --reload` — fine for dev, not for prod. | Use `gunicorn -k uvicorn.workers.UvicornWorker` (4 workers) behind nginx, or a single uvicorn process under systemd. |
| P-6 | HIGH | **No structured logging.** Only `logging.info()` and `print()`. No request IDs, no JSON logs, no log shipping. | Add `structlog` or `loguru`. Include a request ID middleware. Ship to a log aggregator (Loki, CloudWatch, Datadog). |
| P-7 | HIGH | **No error tracking.** No Sentry, no Rollbar, no exception middleware. A 500 in production is invisible. | Add Sentry (free tier covers this scale) with FastAPI integration. |
| P-8 | HIGH | **No CORS production config.** | Set `CORS_ORIGINS=["https://mawidi.dz", "https://www.mawidi.dz"]` in production env. |
| P-9 | HIGH | **No rate limiting.** | Add `slowapi` (or write a small Redis-backed limiter). Minimum: 5/min on `/auth/login`, `/auth/patient/login`, `/auth/register`, `/auth/patient/register`, `/appointments/book`, `/appointments/guest/{id}/cancel`. |
| P-10 | HIGH | **No security headers.** No CSP, no HSTS, no X-Frame-Options, no Referrer-Policy. | Add a FastAPI middleware that sets `Strict-Transport-Security`, `Content-Security-Policy: default-src 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. |
| P-11 | HIGH | **No health/readiness checks beyond `/health`.** | Add a `/ready` endpoint that checks DB connectivity. Use for k8s readinessProbe or systemd `Type=notify`. |
| P-12 | MEDIUM | **No CORS preflight cache.** | Add `max_age` to `CORSMiddleware`. |
| P-13 | MEDIUM | **No request size limit.** A 100MB JSON body to `/appointments/book` is theoretically possible. | Add a reverse-proxy-level limit (nginx `client_max_body_size`) and a FastAPI middleware. |
| P-14 | MEDIUM | **No CI/CD.** No automated tests, no lint, no type-check, no deploy pipeline. | At minimum: GitHub Actions running `ruff check`, `mypy`, `pytest`, `npm run build`, `npm run lint`. |
| P-15 | MEDIUM | **File uploads stored on local disk.** No CDN, no replication. A disk failure loses all profile photos. | Migrate to S3/R2/Backblaze. The `storage_service.py` interface is the only place to change. |
| P-16 | MEDIUM | **`alembic.ini` and `app/db/base.py` are missing from my view of the tree** — the import in `app/models/base.py:33-40` imports all models, but `alembic/env.py` typically needs the same. Verify `alembic/env.py` discovers all models. | Read `alembic/env.py` to confirm target_metadata is set. |
| P-17 | LOW | **No request timeout on Sobersys SMS API.** | Add a 10s timeout to `urllib.request.urlopen` in `sms_service.py:38`. |
| P-18 | LOW | **No graceful shutdown for in-flight background tasks.** If uvicorn is reloaded mid-request, the BackgroundTasks SMTP send is killed mid-handshake. | Move to a proper task queue (RQ, Celery, Dramatiq) when traffic warrants. |

---

## D. Architecture & Code Quality

### D.1 Service layer

`appointment_service.py` is 1,165 lines and mixes 9 distinct concerns:

1. Booking creation (time-based, lines 55-346)
2. Booking creation (queue-based, lines 177-251)
3. Listing (lines 349-391, 394-465)
4. Status updates (lines 467-574)
5. Reschedule — doctor-side (lines 577-685)
6. Reschedule — patient-side (lines 945-1059)
7. Cancellation — patient-side (lines 880-943)
8. Cancellation — guest-side (lines 1117-1165)
9. Analytics (lines 688-819)

**Recommendation**: split into `booking_service.py` (create, with sub-functions for time vs. queue mode), `lifecycle_service.py` (status, reschedule, cancel — both doctor and patient variants), `query_service.py` (listing, today, monthly, analytics), and keep `_appointment_to_response` in a `serializers.py`.

Specific refactorings:

- The two "reschedule" implementations (doctor-side at 577, patient-side at 945) duplicate the working-hours/blocked-slot/queue-validation logic. Extract `validate_target_slot(db, doctor, date, time) -> None` and call from both.
- The mode-transition logic (lines 153-174, 615-628) is duplicated. Extract `effective_mode_for_date(db, doctor, date) -> str`.
- The queue-number-assignment (lines 181-189, 633-640) is duplicated AND has the same race condition in both places. Fix once.
- The anti-spam check (lines 127-151) is gated by `skip_anti_spam` for the doctor-manual-book path — this is intentional, but the boolean flag pattern is a smell. Make it a method on a strategy or pass an `actor: Literal["patient", "doctor", "admin"]` argument.

### D.2 Error handling

| ID | Severity | Finding |
|----|----------|---------|
| D-2.1 | MEDIUM | **Inconsistent error response shape.** Some endpoints return `{"detail": "..."}` (FastAPI default), some return `{"message": "..."}` (custom), some return `{"status": "...", "date": ...}`. The frontend's 422-handler in `api.ts:106-134` assumes Pydantic 422 detail format. Standardize on FastAPI's `HTTPException` with `detail` strings. |
| D-2.2 | MEDIUM | **No global exception handler.** Unhandled `IntegrityError`, `OperationalError`, `SQLAlchemyError` bubble up as 500 with a default body. Add a global handler in `main.py` that logs structured, returns a generic 500 to the client, and reports to Sentry. |
| D-2.3 | MEDIUM | **`appointment_service.py:127-151` leaks another patient's name in the anti-spam error message**: "Un rendez-vous actif existe déjà avec ce numéro de téléphone (Ahmed B.)." — this is an information disclosure. A doctor can use this endpoint to enumerate which patients are booked with them. The error message should not include the existing patient's name. |
| D-2.4 | LOW | **`guest_cancel_appointment` sets `cancellation_reason = "Annulé par le patient (lien public)"`** without checking if the appointment is past. A patient who clicks the cancel link 30 days after the appointment will get a 400 (line 1137-1145), which is correct, but the reason string is not localized. |

### D.3 API design consistency

| ID | Severity | Finding |
|----|----------|---------|
| D-3.1 | MEDIUM | **Mixed pagination styles.** `get_doctor_appointments` returns `AppointmentListResponse` with `items, total, page, per_page`. `get_appointments` (dashboard route, line 87-108) returns a flat `List[AppointmentResponse]`. The dashboard endpoint will become unperformant for active doctors. Use the same paginated response. |
| D-3.2 | MEDIUM | **Inconsistent date format.** `AvailableSlotsResponse.date` is a `str` (ISO), `appointment_date` is a `date`. The frontend does the right thing in BookingPage, but `get_monthly_appointment_counts` returns `dict[str, int]` with the frontend depending on the key format matching `YYYY-MM-DD`. No schema validation. |
| D-3.3 | LOW | **HTTP status code 401 vs 403.** The auth flow uses 401 for "invalid credentials" and 403 for "doctor account deactivated". Correct. But `verify_doctor` returns 404 for non-existent doctor and 200 for "already verified" — fine. `cancel_guest_appointment` returns 404 for "not found" — should arguably be 410 Gone if the appointment existed but is now terminal. Minor. |
| D-3.4 | LOW | **Duplicate `/stats` route** (the issue from the TL;DR). |

### D.4 Frontend state management

| ID | Severity | Finding |
|----|----------|---------|
| D-4.1 | MEDIUM | **Auth state is duplicated between `authStore` (Zustand) and `localStorage`.** The store is initialized from localStorage on creation, and writes back to localStorage on every change. This is the standard SPA pattern but it's error-prone: if a tab is open in two windows and one logs out, the other still has tokens in memory. Add `storage` event listener to sync. |
| D-4.2 | MEDIUM | **No `react-query` / SWR / TanStack Query.** Every page does its own `useEffect` + `useState` + `setLoading` + `setError` dance. This is duplicated across `DashboardLayout`, `CancelAppointmentPage`, `BookingPage`, `DoctorProfilePage`, etc. Adding TanStack Query would delete ~40% of frontend code and give caching, dedup, and retry for free. |
| D-4.3 | LOW | **The `isAuthenticated` flag in `authStore` is set by reading `localStorage` at module load time** (line 29). If the access token expires (30 min) and the refresh fails, the user is "still authenticated" until the 401 interceptor kicks in. Add a token-expiry check. |

### D.5 Component reusability

| ID | Severity | Finding |
|----|----------|---------|
| D-5.1 | MEDIUM | **The `Layout` shared component wraps public pages only.** Dashboard and admin have their own layouts (`DashboardLayout`, `AdminLayout`). Three different header/footer patterns. Consolidate. |
| D-5.2 | MEDIUM | **Date pickers, time pickers, slot pickers are reimplemented per page.** `DoctorProfilePage`, `BookingPage`, `AppointmentsList`, and the various dashboard pages all have ad-hoc date logic. Extract a `DatePicker`, `TimeSlotGrid`, `BookingCalendar` shared component. |
| D-5.3 | LOW | **No Storybook, no design tokens documentation.** Tailwind config exists but the actual color usage drifts. |

---

## E. Feature Gaps for Production (Algeria-specific)

The user said the platform is booking-only and clinical data is out of scope. Below is what's missing for a production-grade booking-only platform in Algeria, **with the explicit note that I am NOT recommending clinical features**.

### E.1 Legal and regulatory

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| E-1.1 | CRITICAL | **Algeria has Law 18-05 (Protection of Individuals in the Processing of Personal Data, 2018)**. The platform stores patient names, phone numbers, email, appointment date/time/doctor, and (potentially) `notes` and `reason` text. This is personal data under the law. The platform needs: a privacy policy in French and Arabic; consent collection at booking time; the right-to-deletion endpoint; the right-to-access endpoint; a Data Protection Officer designation (or equivalent) if processing more than a threshold; data minimization; retention limits. | Add a `consent` field to the booking flow, a `data_retention_days` config, a periodic cleanup job, and a `/me/data-export` + `/me/data-delete` endpoint. |
| E-1.2 | HIGH | **Patient consent is not collected.** The booking form (`BookingPage.tsx`) does not ask for consent. By collecting PII without explicit consent under Law 18-05, the platform is non-compliant. | Add a required consent checkbox. |
| E-1.3 | HIGH | **No privacy policy link** in the registration or booking flow. | Required under most data-protection regimes, including Algeria's. |
| E-1.4 | MEDIUM | **No data retention policy.** Patient data is kept indefinitely. A patient who cancels their account is still in the `appointments` table via `patient_name` and `patient_phone` (denormalized). | Add a 24-month retention for cancelled appointments; anonymize after. |
| E-1.5 | MEDIUM | **Doctor "verification" by admin is not documented in the privacy policy.** What data does the admin see? What data does Mawidi keep from rejected doctors? | Document. |
| E-1.6 | MEDIUM | **Patient can request account deletion but their appointments remain visible to doctors.** The `appointments.patient_id` is `ON DELETE SET NULL` (good), but the denormalized `patient_name` and `patient_phone` are not anonymized. A patient deleting their account leaves a ghost. | Add an anonymization step on patient deletion: `UPDATE appointments SET patient_name = '[anonymized]', patient_phone = NULL WHERE patient_id = X`. |
| E-1.7 | MEDIUM | **No `reason` field disclosure.** The `Appointment.reason` field is free-text and may contain medical information ("douleurs thoraciques", "renouvellement ordonnace"). Under Algeria's law, this could be considered sensitive health data. The user said clinical data is out of scope — but **if a patient types "douleurs cardiaques" into the reason field, that IS clinical data, and the platform is collecting it unintentionally.** | Rename the field to `visit_purpose` (or similar) and add a placeholder: "Objet de la consultation (non médical)". Add a Pydantic validator that rejects strings containing medical keywords. Or remove the field and add it back later as a dropdown of generic categories. |

### E.2 Internationalization (French + Arabic)

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| E-2.1 | HIGH | **`i18next` is in `package.json` but is not actually used.** The frontend has hardcoded French strings everywhere. The `DashboardLayout.tsx` has a "FR" / "العربية" toggle (line 142-148) that does nothing. | Either commit to i18n and add a translation file, or remove the dead toggle and `i18next` dependency. |
| E-2.2 | MEDIUM | **No Arabic translations for any user-facing text.** The platform claims French + Arabic bilingual support (per the user context), but only French is implemented. | Add an `ar` translation file matching the `fr` file. |
| E-2.3 | MEDIUM | **`direction: rtl` is not applied to the layout** when Arabic is selected. CSS would need a `dir="rtl"` on `<html>` and corresponding Tailwind `rtl:` variants. | Standard RTL setup. |
| E-2.4 | LOW | **SMS messages are French-only.** `sms_service.py` hardcodes French. Arabic-speaking patients receive French SMS. | Add an `ar` template per status. |

### E.3 Operational gaps

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| E-3.1 | HIGH | **No reminders.** A patient books for next Tuesday at 10:00. If they forget, no-show. The `reminder_sent` field exists in the schema but nothing populates it. | Add a daily cron that queries `appointments WHERE appointment_date = tomorrow AND reminder_sent = false AND status IN ('pending', 'confirmed')` and sends an SMS reminder. Update the flag. |
| E-3.2 | HIGH | **No calendar export (ICS).** A patient who books a time-based appointment has no way to add it to their phone calendar without manually retyping. | Generate an `.ics` file as part of the confirmation SMS link. |
| E-3.3 | MEDIUM | **No "reschedule by patient" is exposed in the UI for guest patients.** The route exists (`PATCH /appointments/guest/{id}/reschedule`? — actually it doesn't, only the patient-authenticated route exists). A guest can only cancel. | Add a reschedule link in the SMS for guest patients, gated by a token. |
| E-3.4 | MEDIUM | **No support for recurring appointments.** Algerian patients often book follow-ups; doctors often have weekly recurring patients. | Allow a doctor to flag "recurring patient" and pre-fill. |
| E-3.5 | MEDIUM | **No cancellation policy enforcement.** A patient who cancels 5 minutes before the appointment is treated the same as one who cancels 24 hours in advance. The doctor's `no_show_rate` calculation therefore conflates "no-show" with "cancelled too late". | Add a `cancelled_late` status, or a `cancelled_by` and `cancellation_notice_hours` field, and surface it in stats. |
| E-3.6 | MEDIUM | **No phone number normalization.** `PHONE_REGEX` accepts `+213...`, `213...`, `0...`. But the system stores them as-typed. Two patients could have the same phone stored as `0555123456` and `+213555123456` and be considered different patients. | Normalize to a canonical form on insert (e.g., always store as `0XXXXXXXXX`). |
| E-3.7 | LOW | **No audit log.** Doctor modifies a patient's appointment status; no record of who, when, what. Important for disputes. | Add an `audit_log` table or use Postgres's row-level logging. |
| E-3.8 | LOW | **No "doctor is on holiday" mode.** A doctor who goes on vacation must remember to delete working hours for the affected period. There is no bulk "off for the next 2 weeks" toggle. | Add it. |
| E-3.9 | LOW | **The search endpoint does not support ranking.** Results are returned in DB insertion order. | Add ORDER BY relevance (e.g., full-text search on name/specialty, or simple alphabetical). |
| E-3.10 | LOW | **No "doctor of the day" / featured doctor on the homepage.** Marketing-driven feature, out of scope for a v1 audit but worth noting. |

### E.4 Scope boundary check

The user explicitly asked me to flag if any existing field, model, or endpoint stores clinical data. Findings:

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| E-4.1 | LOW | **`Appointment.notes` field exists** with no UI exposure. The field name is ambiguous — could be doctor-internal booking notes (intended) or clinical observations (unintended). Current usage: none. | Rename to `internal_notes` to make the scope explicit. Add a Pydantic validator that rejects strings > 200 chars and warns on medical keywords. |
| E-4.2 | LOW | **`Appointment.reason` field** is patient-provided free text. The frontend placeholder says "Motif" which is ambiguous (could be "I have a headache" or "follow-up visit"). Patients may type clinical content here. | As above (E-1.7): rename to `visit_purpose`, add a placeholder, add validation. |
| E-4.3 | NONE | No diagnosis, prescription, treatment, lab result, allergy, medication, ICD/CPT/SNOMED/LOINC code, medical history, or any other clinical data field exists. ✓ The scope boundary is respected. |

---

## Severity Calibration — What to Do First

For a single-founder team launching with 50–100 doctors in one city:

**This week (before any real patient books):**
1. Enforce `is_verified` on doctor login (S-A1) — without this, the verification flow is theater.
2. Fix the queue-number race (L-A1) — first day with 2 popular doctors and a WhatsApp-shared link, you'll see "please retry" errors and lose bookings.
3. Fix the duplicate `/stats` route (TL;DR #4) — broken endpoint, will surface on first dashboard load.
4. Fix the stored XSS in file upload (S-C2) — a malicious doctor can compromise other doctors' admin sessions.
5. Add a per-IP rate limit on `/auth/login` and `/appointments/book` (P-9) — minimal effort, blocks 90% of the brute-force surface.
6. Set `SECRET_KEY` to a real random value in production env, and add a Pydantic validator that refuses to start with the default (P-2).
7. Change all SMS/email URLs from `localhost:5173` to a `settings.FRONTEND_URL` (TL;DR #8) — patients can't reset passwords otherwise.

**Before public launch (in the next 1–2 months):**
8. Migrate JWT to httpOnly cookies (S-A5).
9. Implement the `cancellation_token` separate-from-appointment-id pattern (A.6) or accept the design and document it.
10. Set up HTTPS, security headers, backups, Sentry, structured logging (P-1, P-6, P-7, P-10, P-3).
11. Address the password-reset bcrypt-on-JWT (S-A4).
12. Make the email verification flow a POST (S-A7).
13. Add the patient consent collection (E-1.2) and a basic privacy policy (E-1.3) — required for Law 18-05.
14. Add the daily reminder cron (E-3.1).
15. Refactor `appointment_service.py` (D.1) and add a single integration test for the queue race.

**Before scaling past 100 doctors:**
16. Rate limiting across all endpoints (P-9 expanded).
17. Full RBAC distinction between doctor and assistant (S-A8).
18. CI/CD with tests, lint, type-check, deploy (P-14).
19. Migrate uploads to S3-compatible storage (P-15).
20. Async SMTP worker (P-18).
21. i18n (E-2) if/when Arabic becomes a real requirement.
22. Anti-spam check made race-safe (L-A2).
23. `reason` field sanitization and `notes` rename (E-4).
24. Data retention and right-to-deletion endpoints (E-1.4, E-1.6).

The most important takeaway: **the verification gate is purely cosmetic, the queue-number race will trigger on day one, and the file upload is a stored-XSS vector**. Fix those three, set `SECRET_KEY` properly, and you can launch to your first 10 doctors.
