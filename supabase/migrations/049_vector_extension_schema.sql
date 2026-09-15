-- ============================================================
-- 049_vector_extension_schema.sql
--
-- Supabase's security advisor flags extensions installed in `public`.
-- The installed pgvector extension is relocatable, so move it to the
-- standard `extensions` schema while preserving all existing dependent
-- columns, indexes, and functions by object OID.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
