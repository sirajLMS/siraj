-- Source: 4e-default_super_admin_seed.sql
-- Migration 4e: Seed default Super Admin user account
-- Creates default super admin user (admin@siraj.local / Seed_Pass1!) and links to super_admin permission group.

DO $$
DECLARE
  v_user_id UUID;
  v_group_id UUID;
BEGIN
  -- Insert default super admin user if not exists
  INSERT INTO users (id, name, email, password, is_super_admin, status, timezone, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Super Admin',
    'admin@siraj.local',
    -- Seed_Pass1!
    '$2b$12$nXFLfwUx0pdly5.UbZXA2O7XPh6LYz6bfP3X/MG9K/5VD/WuvUaku',
    true,
    'ACTIVATED',
    'UTC',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;

  -- Get user_id if already existed
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM users WHERE email = 'admin@siraj.local';
  END IF;

  -- Get super_admin permission group id
  SELECT id INTO v_group_id FROM permission_groups WHERE slug = 'super_admin';

  IF v_user_id IS NOT NULL AND v_group_id IS NOT NULL THEN
    -- Assign to super_admin permission group
    INSERT INTO user_permission_groups (user_id, group_id, assigned_at)
    VALUES (v_user_id, v_group_id, NOW())
    ON CONFLICT (user_id, group_id) DO NOTHING;

    -- Ensure staff profile marker exists
    INSERT INTO staff_profiles (id, user_id, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;--> statement-breakpoint

