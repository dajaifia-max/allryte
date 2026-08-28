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

## Verification

```text
npm run check
npm test
```

Before production, replace every draft phone number, email, address, provider credential, billing statement, testimonial, and legal/privacy placeholder. Production hosting and the portal vendor still require a documented security and privacy review.
