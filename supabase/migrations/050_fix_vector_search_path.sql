-- ============================================================
-- 050_fix_vector_search_path.sql
--
-- Migration 049 moves pgvector from `public` to `extensions` to satisfy
-- Supabase's extension-schema security recommendation. SQL-function
-- bodies are resolved using their configured search_path when they run,
-- so match_ai_knowledge_semantic must include `extensions` or its
-- `::vector(1536)` cast cannot resolve.
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_ai_knowledge_semantic(
  p_account_id      uuid,
  p_query_embedding text,
  p_match_count     integer
)
RETURNS TABLE (id uuid, content text, distance real) AS $$
  SELECT c.id,
         c.content,
         (c.embedding <=> p_query_embedding::vector(1536)) AS distance
  FROM ai_knowledge_chunks c
  WHERE c.account_id = p_account_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query_embedding::vector(1536)
  LIMIT GREATEST(p_match_count, 0);
$$ LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.match_ai_knowledge_semantic(uuid, text, integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_ai_knowledge_semantic(uuid, text, integer) TO authenticated, service_role;
