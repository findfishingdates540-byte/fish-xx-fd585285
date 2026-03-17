

# Fix RLS Performance on `user_roles` Table

## Problem
The `user_roles` table's "Users can view own roles" policy calls `auth.uid()` directly, causing PostgreSQL to re-evaluate it per row instead of once per query. This degrades performance at scale.

## Changes

### Database Migration
A single SQL migration to:

1. Drop the existing policy
2. Recreate it with `(SELECT auth.uid())` wrapper for optimal performance
3. Add an index on `user_id` if not already present

```sql
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
```

### No Code Changes
This is a database-only fix. No application code needs to change -- the `has_role()` security definer function and all existing queries continue to work as before.

