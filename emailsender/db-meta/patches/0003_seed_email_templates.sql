-- Primebrick: emailsender baseline — system email templates
-- Source: live emailsender.email_templates (6 created_by='system' rows)
-- Required: be auth invokes these by template_code (send throws if absent)


\restrict 18OShdN1ov0xey80ZoweewJ4H2nzNkaSRZGJk616Ax8Vwz3HSDIcPkrvWcB0CST




INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (1, 'ed5a9dab-1c64-41d6-8df5-db180af80f6c', 'invitation_welcome', 'en-US', 'Welcome to Primebrick — set up your account', '<html><body><h2>Welcome to Primebrick, {{display_name}}!</h2><p>You have been invited to join Primebrick. Click the link below to set up your account and choose your password:</p><p><a href="{{welcome_link}}">Set up my account</a></p><p>If the button doesn''t work, copy and paste this link into your browser:</p><p>{{welcome_link}}</p><p>This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.</p><p>— The Primebrick Team</p></body></html>', 'Welcome to Primebrick, {{display_name}}!

You have been invited to join Primebrick. Click the link below to set up your account and choose your password:

{{welcome_link}}

This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.

— The Primebrick Team', NULL, '{"display_name": "string", "welcome_link": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);
INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (2, '4c2ebe5e-d28f-4dec-9def-d5bd9a515c53', 'otp_verification', 'en-US', 'Your Primebrick verification code', '<html><body><h2>Verify your email, {{display_name}}</h2><p>Use the following 6-digit code to verify your email address:</p><h1 style="font-size:32px;letter-spacing:8px;color:#3b82f6;">{{otp_code}}</h1><p>This code expires in 5 minutes. If you did not request this code, please ignore this email.</p><p>— The Primebrick Team</p></body></html>', 'Verify your email, {{display_name}}

Use the following 6-digit code to verify your email address:

{{otp_code}}

This code expires in 5 minutes. If you did not request this code, please ignore this email.

— The Primebrick Team', NULL, '{"otp_code": "string", "display_name": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);
INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (3, '05f9ca3a-5e8f-4aba-884d-03bb245e9907', 'password_changed', 'en-US', 'Your Primebrick password has been set', '<html><body><h2>Password set successfully, {{display_name}}</h2><p>Your Primebrick account password has been set. If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, your account may be compromised. Please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>', 'Password set successfully, {{display_name}}

Your Primebrick account password has been set. If this was you, no further action is needed.

If this was NOT you, your account may be compromised. Please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team', NULL, '{"alert_link": "string", "admin_mailto": "string", "display_name": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);
INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (4, 'fa4fdb3c-83ae-4946-ba76-c9144204be7e', 'passkey_activated', 'en-US', 'A passkey has been activated on your Primebrick account', '<html><body><h2>Passkey activated, {{display_name}}</h2><p>A new passkey has been enrolled on your Primebrick account{{#if passkey_label}} ({{passkey_label}}){{/if}}.</p><p>If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>', 'Passkey activated, {{display_name}}

A new passkey has been enrolled on your Primebrick account.

If this was you, no further action is needed.

If this was NOT you, please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team', NULL, '{"alert_link": "string", "admin_mailto": "string", "display_name": "string", "passkey_label": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);
INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (5, 'acb5f141-2382-4573-a0e1-c90890f413f5', 'passkey_removed', 'en-US', 'A passkey has been removed from your Primebrick account', '<html><body><h2>Passkey removed, {{display_name}}</h2><p>A passkey has been removed from your Primebrick account{{#if passkey_label}} ({{passkey_label}}){{/if}}.</p><p>If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>', 'Passkey removed, {{display_name}}

A passkey has been removed from your Primebrick account.

If this was you, no further action is needed.

If this was NOT you, please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team', NULL, '{"alert_link": "string", "admin_mailto": "string", "display_name": "string", "passkey_label": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);
INSERT INTO emailsender.email_templates (id, uuid, code, language_iso, subject, body_html, body_text, mjml_source, variables, created_at, created_by, updated_at, updated_by, version, deleted_at, deleted_by) OVERRIDING SYSTEM VALUE VALUES (6, '0cde9ae1-0a10-4d6b-9d9f-d61b96905a41', 'admin_unauthorized_alert', 'en-US', '[ALERT] Unauthorized activity reported by {{user_display_name}}', '<html><body><h2>Unauthorized activity alert</h2><p>A user has reported unauthorized activity on their account:</p><ul><li><strong>User:</strong> {{user_display_name}}</li><li><strong>Email:</strong> {{user_email}}</li><li><strong>Alert type:</strong> {{alert_type}}</li><li><strong>Reported at:</strong> {{timestamp}}</li></ul><p>Please investigate and take appropriate action (e.g. reset the user''s password, revoke sessions, disable the account).</p><p>— Primebrick Security</p></body></html>', 'Unauthorized activity alert

A user has reported unauthorized activity on their account:

User: {{user_display_name}}
Email: {{user_email}}
Alert type: {{alert_type}}
Reported at: {{timestamp}}

Please investigate and take appropriate action.

— Primebrick Security', NULL, '{"timestamp": "string", "alert_type": "string", "user_email": "string", "user_display_name": "string"}', '2026-07-17 12:04:36.809624+00', 'system', '2026-07-17 12:04:36.809624+00', 'system', 1, NULL, NULL);



\unrestrict 18OShdN1ov0xey80ZoweewJ4H2nzNkaSRZGJk616Ax8Vwz3HSDIcPkrvWcB0CST


SELECT setval('emailsender.email_templates_id_seq', (SELECT max(id) FROM emailsender.email_templates));
