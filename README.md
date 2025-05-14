This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Documentation

All tables and columns in the `public` schema are fully documented using PostgreSQL `COMMENT ON` statements. You can view descriptions directly in the Supabase UI or via any database introspection tool.

## Database Schema

The current database schema (DDL) is stored in [`db/schema.sql`](db/schema.sql).

If you make changes to the database via the Supabase SQL editor or manually,  
please export the updated schema and commit the new version of this file.

How to export:  
- Use the provided script or Supabase CLI/pg_dump to generate `db/schema.sql`.
- See: https://supabase.com/docs/guides/database/backups#exporting-your-database-schema

## Environment Variables

See [.env.local.example](./.env.local.example) and [.env.test.example](./.env.test.example) for all required variables and their descriptions.
