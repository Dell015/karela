-- ============================================================
-- KARELA DEMO DATA: remove the mock civic reports
--
-- Removes every pin added by tuguegarao_demo_reports.sql
-- (zone_name = 'karela-demo'). Real pins are not touched.
--
-- If someone sent a real report next to a demo pin, the app joined it to
-- that pin. Those reports are kept; they are only unlinked from it.
-- ============================================================

UPDATE public.civic_reports SET node_id = NULL
WHERE node_id IN (SELECT id FROM public.civic_nodes WHERE zone_name = 'karela-demo');

DELETE FROM public.civic_nodes WHERE zone_name = 'karela-demo';

-- Check: should return 0.
SELECT count(*) AS demo_pins_left FROM public.civic_nodes WHERE zone_name = 'karela-demo';
