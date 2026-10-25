/*
# Create github_connections table

Stores a GitHub Personal Access Token (PAT) so the app can read/write
repositories and open pull requests on the user's behalf.

1. New Tables
- `github_connections`
  - `id` (uuid, primary key)
  - `token` (text, not null) — GitHub PAT (fine-grained or classic). Stored
    as-is; access is restricted to the server (SECURITY DEFINER proxy) and the
    client never reads it back through the Data API.
  - `username` (text, not null) — GitHub login associated with the token, for display
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `github_connections`.
- Grant SELECT, INSERT, DELETE to `anon` + `authenticated` (single-tenant app,
  no sign-in screen). We DO NOT grant UPDATE, so the token column cannot be
  altered by a column-privilege narrowing trick; to rotate, delete + re-insert.
- SELECT policy exposes the row but the application only ever selects the
  `username` column for display — the token is fetched only inside the
  SECURITY DEFINER edge function context (the proxy reads it with the
  service role, bypassing RLS).
- Important: the token is a sensitive credential. The frontend never requests
  the `token` column. The github-proxy edge function uses the service role key
  to read it and never returns it to the client.
*/

CREATE TABLE IF NOT EXISTS github_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

GRANT SELECT (id, username, created_at, updated_at) ON github_connections TO anon, authenticated;
GRANT INSERT (token, username) ON github_connections TO anon, authenticated;
GRANT DELETE ON github_connections TO anon, authenticated;

-- Allow reading the non-secret columns (the proxy uses the service role to read the token)
DROP POLICY IF EXISTS "anon_select_github_connection" ON github_connections;
CREATE POLICY "anon_select_github_connection" ON github_connections
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_github_connection" ON github_connections;
CREATE POLICY "anon_insert_github_connection" ON github_connections
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_github_connection" ON github_connections;
CREATE POLICY "anon_delete_github_connection" ON github_connections
  FOR DELETE TO anon, authenticated USING (true);

-- Revoke table-wide UPDATE entirely (no column grants) so the token can't be
-- modified through the Data API. Rotation = delete + insert.
REVOKE UPDATE ON github_connections FROM anon, authenticated;
