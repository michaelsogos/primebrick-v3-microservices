-- `customer_high_value` template — declare its interpolation vocabulary.
-- The `variables` jsonb shape is `{name: json_type}`; the payload_map
-- `x_map_keys` hint reads these keys to suggest mappable variable rows
-- for the `variables` field of emailsender.send.
UPDATE emailsender.email_templates
SET variables = jsonb_build_object(
      'customer_name', 'string',
      'amount', 'number',
      'threshold', 'number',
      'account_manager', 'string'
    ),
    updated_at = now(),
    updated_by = 'migration-customer-high-value-vars',
    version = version + 1
WHERE code = 'customer_high_value'
  AND deleted_at IS NULL;
