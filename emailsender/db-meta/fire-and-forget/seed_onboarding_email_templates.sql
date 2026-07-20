-- Fire-and-forget: Seed email templates for the user onboarding/invitation flow.
--
-- Templates:
--   1. invitation_welcome  — sent to new users with a welcome link
--   2. otp_verification    — sent with a 6-digit OTP code
--   3. password_changed    — notification after password is set/changed
--   4. passkey_activated   — notification after a passkey is enrolled
--   5. passkey_removed     — notification after a passkey is deleted
--   6. admin_unauthorized_alert — sent to admin when user clicks "if this wasn't you"
--
-- Idempotent: uses a WHERE NOT EXISTS guard on (code, language_iso).
-- Run this ONCE on the existing emailsender database.
--
-- Date: 2026-07-17

BEGIN;

-- 1. invitation_welcome (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'invitation_welcome', 'en', 'Welcome to Primebrick — set up your account',
'<html><body><h2>Welcome to Primebrick, {{display_name}}!</h2><p>You have been invited to join Primebrick. Click the link below to set up your account and choose your password:</p><p><a href="{{welcome_link}}">Set up my account</a></p><p>If the button doesn''t work, copy and paste this link into your browser:</p><p>{{welcome_link}}</p><p>This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.</p><p>— The Primebrick Team</p></body></html>',
'Welcome to Primebrick, {{display_name}}!

You have been invited to join Primebrick. Click the link below to set up your account and choose your password:

{{welcome_link}}

This link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.

— The Primebrick Team',
'{"display_name":"string","welcome_link":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'invitation_welcome' AND language_iso = 'en'
);

-- 2. otp_verification (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'otp_verification', 'en', 'Your Primebrick verification code',
'<html><body><h2>Verify your email, {{display_name}}</h2><p>Use the following 6-digit code to verify your email address:</p><h1 style="font-size:32px;letter-spacing:8px;color:#3b82f6;">{{otp_code}}</h1><p>This code expires in 5 minutes. If you did not request this code, please ignore this email.</p><p>— The Primebrick Team</p></body></html>',
'Verify your email, {{display_name}}

Use the following 6-digit code to verify your email address:

{{otp_code}}

This code expires in 5 minutes. If you did not request this code, please ignore this email.

— The Primebrick Team',
'{"display_name":"string","otp_code":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'otp_verification' AND language_iso = 'en'
);

-- 3. password_changed (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'password_changed', 'en', 'Your Primebrick password has been set',
'<html><body><h2>Password set successfully, {{display_name}}</h2><p>Your Primebrick account password has been set. If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, your account may be compromised. Please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>',
'Password set successfully, {{display_name}}

Your Primebrick account password has been set. If this was you, no further action is needed.

If this was NOT you, your account may be compromised. Please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team',
'{"display_name":"string","alert_link":"string","admin_mailto":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'password_changed' AND language_iso = 'en'
);

-- 4. passkey_activated (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'passkey_activated', 'en', 'A passkey has been activated on your Primebrick account',
'<html><body><h2>Passkey activated, {{display_name}}</h2><p>A new passkey has been enrolled on your Primebrick account{{#if passkey_label}} ({{passkey_label}}){{/if}}.</p><p>If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>',
'Passkey activated, {{display_name}}

A new passkey has been enrolled on your Primebrick account.

If this was you, no further action is needed.

If this was NOT you, please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team',
'{"display_name":"string","passkey_label":"string","alert_link":"string","admin_mailto":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'passkey_activated' AND language_iso = 'en'
);

-- 5. passkey_removed (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'passkey_removed', 'en', 'A passkey has been removed from your Primebrick account',
'<html><body><h2>Passkey removed, {{display_name}}</h2><p>A passkey has been removed from your Primebrick account{{#if passkey_label}} ({{passkey_label}}){{/if}}.</p><p>If this was you, no further action is needed.</p><p><strong>If this was not you</strong>, please contact your administrator immediately:</p><p><a href="{{admin_mailto}}">Contact administrator</a></p><p>Or report unauthorized access:</p><p><a href="{{alert_link}}">Report unauthorized change</a></p><p>— The Primebrick Team</p></body></html>',
'Passkey removed, {{display_name}}

A passkey has been removed from your Primebrick account.

If this was you, no further action is needed.

If this was NOT you, please contact your administrator immediately.

Report unauthorized change: {{alert_link}}

— The Primebrick Team',
'{"display_name":"string","passkey_label":"string","alert_link":"string","admin_mailto":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'passkey_removed' AND language_iso = 'en'
);

-- 6. admin_unauthorized_alert (en)
INSERT INTO "emailsender"."email_templates" ("code", "language_iso", "subject", "body_html", "body_text", "variables", "created_by")
SELECT 'admin_unauthorized_alert', 'en', '[ALERT] Unauthorized activity reported by {{user_display_name}}',
'<html><body><h2>Unauthorized activity alert</h2><p>A user has reported unauthorized activity on their account:</p><ul><li><strong>User:</strong> {{user_display_name}}</li><li><strong>Email:</strong> {{user_email}}</li><li><strong>Alert type:</strong> {{alert_type}}</li><li><strong>Reported at:</strong> {{timestamp}}</li></ul><p>Please investigate and take appropriate action (e.g. reset the user''s password, revoke sessions, disable the account).</p><p>— Primebrick Security</p></body></html>',
'Unauthorized activity alert

A user has reported unauthorized activity on their account:

User: {{user_display_name}}
Email: {{user_email}}
Alert type: {{alert_type}}
Reported at: {{timestamp}}

Please investigate and take appropriate action.

— Primebrick Security',
'{"user_display_name":"string","user_email":"string","alert_type":"string","timestamp":"string"}'::jsonb,
'system'
WHERE NOT EXISTS (
  SELECT 1 FROM "emailsender"."email_templates" WHERE code = 'admin_unauthorized_alert' AND language_iso = 'en'
);

COMMIT;
