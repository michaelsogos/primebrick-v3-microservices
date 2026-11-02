-- job_rule source/destination field tooltips — user-friendly rewrite.
-- The old text was developer-jargon ("NATS subject", "jobs.due.<lane>…");
-- the hint tells the end user what the field IS and what it is FOR —
-- the same text feeds the auto-generated user documentation.
UPDATE job.translations AS t
SET value = v.value, updated_by = 'migration-job-rule-hint-tooltips'
FROM (VALUES
  ('job.entities.job_rule.hints.event_subject', 'en-GB', 'The event that can trigger this rule: when something happens in the system (e.g. a customer crosses a threshold) the rule can run. Pick an available event or type an event name.'),
  ('job.entities.job_rule.hints.event_subject', 'en-US', 'The event that can trigger this rule: when something happens in the system (e.g. a customer crosses a threshold) the rule can run. Pick an available event or type an event name.'),
  ('job.entities.job_rule.hints.event_subject', 'it-IT', 'L''evento che può attivare questa regola: quando succede qualcosa nel sistema (per esempio un cliente supera una soglia) la regola può partire. Scegli un evento disponibile o digita il nome di un evento.'),
  ('job.entities.job_rule.hints.event_subject', 'de-DE', 'Das Ereignis, das diese Regel auslösen kann: wenn im System etwas passiert (z. B. ein Kunde überschreitet einen Schwellenwert), kann die Regel starten. Ein verfügbares Ereignis wählen oder einen Ereignisnamen eingeben.'),
  ('job.entities.job_rule.hints.event_subject', 'fr-FR', 'L''événement qui peut déclencher cette règle : quand quelque chose se produit dans le système (par ex. un client dépasse un seuil), la règle peut partir. Choisir un événement disponible ou saisir un nom d''événement.'),
  ('job.entities.job_rule.hints.event_subject', 'es-ES', 'El evento que puede activar esta regla: cuando ocurre algo en el sistema (por ej. un cliente supera un umbral), la regla puede ejecutarse. Elija un evento disponible o escriba un nombre de evento.'),
  ('job.entities.job_rule.hints.event_subject', 'pt-PT', 'O evento que pode acionar esta regra: quando algo acontece no sistema (por ex. um cliente ultrapassa um limite), a regra pode correr. Escolha um evento disponível ou digite um nome de evento.'),
  ('job.entities.job_rule.hints.target_subject', 'en-GB', 'What the rule does when it triggers: the operation to run (e.g. send an email). Available destinations depend on the active services.'),
  ('job.entities.job_rule.hints.target_subject', 'en-US', 'What the rule does when it triggers: the operation to run (e.g. send an email). Available destinations depend on the active services.'),
  ('job.entities.job_rule.hints.target_subject', 'it-IT', 'Cosa fa la regola quando scatta: l''operazione da eseguire (per esempio inviare un''email). Le destinazioni disponibili dipendono dai servizi attivi.'),
  ('job.entities.job_rule.hints.target_subject', 'de-DE', 'Was die Regel beim Auslösen tut: die auszuführende Operation (z. B. eine E-Mail senden). Verfügbare Ziele hängen von den aktiven Diensten ab.'),
  ('job.entities.job_rule.hints.target_subject', 'fr-FR', 'Ce que fait la règle quand elle se déclenche : l''opération à exécuter (par ex. envoyer un e-mail). Les destinations disponibles dépendent des services actifs.'),
  ('job.entities.job_rule.hints.target_subject', 'es-ES', 'Qué hace la regla al dispararse: la operación a ejecutar (por ej. enviar un correo). Los destinos disponibles dependen de los servicios activos.'),
  ('job.entities.job_rule.hints.target_subject', 'pt-PT', 'O que a regra faz ao disparar: a operação a executar (por ex. enviar um e-mail). Os destinos disponíveis dependem dos serviços ativos.')
) AS v(key, language, value)
WHERE t.key = v.key AND t.language = v.language AND t.deleted_at IS NULL;
