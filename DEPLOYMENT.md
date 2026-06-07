# Deployment Guide for AETDRIXZ AI

## Prerequisites
- Vercel Account
- Supabase Account
- Gemma 4 API Keys

## Supabase Setup
1. Create a new project in Supabase.
2. Go to the SQL Editor and enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy the Connection String from Project Settings $\rightarrow$ Database.

## Prisma Setup
1. Update `.env` with your `DATABASE_URL`.
2. Run the migration to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

## Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Add the following Environment Variables in the Vercel Dashboard:
   - `DATABASE_URL`: Your Supabase connection string.
   - `GEMMA_API_KEY_1`, `GEMMA_API_KEY_2`, `GEMMA_API_KEY_3`: Your Gemma API keys.
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_ANON_KEY`: Your Supabase anon public key.
3. Deploy the project.

## Post-Deployment
- Ensure the `pgvector` extension is active.
- Verify that the AI responses are streaming correctly.
- Test the project bundling and live preview in the workspace.
