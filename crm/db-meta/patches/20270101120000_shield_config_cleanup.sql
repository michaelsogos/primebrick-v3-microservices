-- Client-shield config cleanup (zero-debt sweep WP-1) — orphaned entries
-- written by the retired enrollment machinery. No reader exists since the
-- SDK registrar strip (arch-internal-trust-and-transports WP-5).
DELETE FROM crm.config_entries
 WHERE key LIKE 'service_client_shield%'
    OR key = 'service_key_derivation_secret';
