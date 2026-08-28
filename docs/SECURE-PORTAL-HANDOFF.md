# Secure patient portal handoff

## Security boundary

This public website must remain PHI-free. It does not authenticate patients, accept clinical intake, store records, or proxy portal data. The only portal integration is a server-controlled redirect to a separately hosted patient portal.

The portal must remain disabled until the practice has selected a HIPAA-capable EHR/portal vendor, completed its risk analysis, and signed all required business associate agreements (BAAs).

## What is implemented

- `GET /api/portal/status` reports only whether the portal handoff is available. It never exposes the configured vendor URL or credentials.
- `GET /api/portal/launch` redirects only to the exact HTTPS destination set on the server. Browser-supplied redirect targets and patient identifiers are ignored.
- The handoff fails closed with HTTP 503 while the portal is disabled or unconfigured.
- Portal responses are not cached and the redirect uses a `no-referrer` policy.
- The static server exposes an explicit file allowlist, so backend source, environment files, documentation, and repository metadata cannot be downloaded.
- Browser hardening includes CSP, anti-framing, MIME sniffing protection, permissions restrictions, a referrer policy, and production HSTS.
- Request logs contain a generated request ID, method, path, status, and duration only. They intentionally omit query strings, form data, IP addresses, cookies, authorization data, and portal URLs.
- The same security policy is shared across Node and web-standard Fetch API runtimes, reducing the chance that changing hosts creates a weaker duplicate implementation.

## Configure a vendor

Copy `.env.example` to `.env` locally or set equivalent protected runtime variables at the host:

1. Set `PORTAL_URL` to the vendor's HTTPS patient login or registration page.
2. Set `PORTAL_ALLOWED_HOSTS` to that exact hostname. Multiple approved hosts may be comma-separated.
3. Set `PORTAL_ENABLED=true` only after testing and written approval.
4. In production set `NODE_ENV=production`, `PUBLIC_ORIGIN=https://www.example.com`, `ENFORCE_HTTPS=true`, and `TRUST_PROXY=true` only when the hosting proxy overwrites `X-Forwarded-Proto`.

`PORT` and `TRUST_PROXY` apply only to the Node adapter. Edge/Sites-style hosts use the remaining variables and provide their static asset service through the platform binding.

Do not put API keys, OAuth client secrets, patient identifiers, email addresses, or one-time tokens in `PORTAL_URL`.

## Vendor adapter extension point

For a normal vendor-hosted login, no code change is needed. If a future vendor requires OpenID Connect, SAML, or a one-time launch token, implement that flow in `server/portal.mjs` and keep all credential exchange server-to-server. Do not accept a destination URL or patient identifier directly from the public browser. The vendor should own patient authentication, MFA, session expiry, identity verification, role-based access, audit history, secure messaging, and record retention.

## Go-live gates

- Signed BAA and documented vendor/security review for every service that creates, receives, maintains, or transmits ePHI.
- Written data-flow and risk analysis covering the portal, hosting, email/SMS, backups, support, and subprocessors.
- Real clinic contact information, provider credentials, privacy notice, Notice of Privacy Practices where applicable, terms, retention policy, and incident contact.
- Portal tests for MFA, account recovery, session expiry, least privilege, audit events, breach response, backup/restore, and termination/data return.
- Production TLS and header verification from outside the hosting network.
- No advertising pixels, session replay, or analytics on portal/intake pages unless specifically approved through privacy and security review.
- Keyboard, screen-reader, zoom, contrast, reduced-motion, and mobile acceptance testing.

This scaffold reduces the public site's exposure; it does not by itself make the practice or a portal HIPAA compliant. Final compliance decisions require the practice's qualified privacy/security lead and counsel.

Primary guidance: [HHS Security Rule summary](https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html), [HHS cloud and BAA guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html), [OWASP HTTP security headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), and [OWASP unvalidated redirect guidance](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html).
