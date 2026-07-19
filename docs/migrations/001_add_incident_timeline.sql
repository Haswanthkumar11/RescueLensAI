-- Migration 001: incident timeline + risk explanation
-- Safe to run on an existing database: both columns are additive with
-- defaults, so no existing rows or queries break. Run this once in the
-- Supabase SQL editor.

alter table incidents
  add column if not exists timeline jsonb not null default '[]'::jsonb,
  add column if not exists contributing_factors jsonb not null default '{}'::jsonb;
