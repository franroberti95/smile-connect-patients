# Smile Connect - Patient Portal

Public-facing Next.js app for patients to book appointments, view payments, and access their dental history.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (New York style)
- TanStack Query
- React Hook Form + Zod
- next-themes + sonner

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SMILE_CONNECT_API_URL=https://api.smile-connect.vercel.app
NEXT_PUBLIC_PATIENT_PORTAL_URL=https://pacientes.smileconnect.vercel.app

# Firebase public config (same project as smile-connect)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

The portal expects the `smile-connect` API to expose public endpoints for:

- `GET /api/public/clinics/:slug` — clinic profile and booking config
- `GET /api/public/clinics/:slug/availability` — available slots
- `POST /api/public/clinics/:slug/appointments` — book an appointment

## Project structure

```
src/
  app/
    (main)/
    reservar/[slug]/   # public booking page per clinic
    login/             # patient authentication
  components/
    ui/                # shadcn/ui components
  lib/
    api.ts             # typed API client
    utils.ts           # cn() helper
```

## Notes

This project is intentionally separate from `smile-connect` (the clinic dashboard) so the public patient experience can be deployed, styled, and iterated independently.
