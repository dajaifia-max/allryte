# Allryte Psychiatry website

This repository contains the public Allryte Psychiatry website and a small, PHI-free backend for handing patients off to a separately hosted patient portal.

## Local preview

Use Node.js 20.12 or newer:

```text
npm start
```

The default local address is `http://127.0.0.1:8787`. Copy `.env.example` to `.env` only when local configuration is needed. `.env` is ignored by source control.

## Patient portal

The portal is disabled by default. When disabled, the website clearly directs patients to call the clinic and the launch endpoint fails closed. See `docs/SECURE-PORTAL-HANDOFF.md` before configuring a vendor.

The public site must not receive clinical intake or patient records. Keep those workflows inside a reviewed EHR/portal covered by the practice's applicable agreements and policies.

## Hosting portability

The backend security rules now live in a web-standard Fetch API core, separate from any one hosting company:

- `server/fetch-app.mjs` contains the shared portal routes, redirect validation, security headers, and static-file allowlist.
- `server/app.mjs` adapts that core to a conventional Node.js server.
- `worker.mjs` adapts the same core to Cloudflare Worker and Sites-style runtimes with a host-provided `ASSETS` binding.

The environment variable names and fail-closed portal behavior are the same on both paths. Other serverless hosts can import `createFetchHandler` and provide a small static-asset loader instead of rewriting the security logic.

This makes a later Sites conversion substantially smaller, but does not create or deploy a Sites project by itself. Sites should host only this PHI-free public website and external portal handoff—not patient intake, records, messages, or authentication.

## Verification

```text
npm run check
npm test
```

Before production, replace every draft phone number, email, address, provider credential, billing statement, testimonial, and legal/privacy placeholder. Production hosting and the portal vendor still require a documented security and privacy review.
