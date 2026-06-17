-- GoLive: cronograma oficial (horário de referência UTC; abertura = 17/06/2026 10:00 BRT)
UPDATE contest_config SET value = '2026-06-17T13:00:00Z', updated_at = now() WHERE key = 'registration_start';
UPDATE contest_config SET value = '2026-07-02T13:00:00Z', updated_at = now() WHERE key = 'registration_end';
UPDATE contest_config SET value = '2026-07-04T13:00:00Z', updated_at = now() WHERE key = 'validation_end';
UPDATE contest_config SET value = '2026-07-19T13:00:00Z', updated_at = now() WHERE key = 'voting_end';
