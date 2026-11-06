-- 20261120100000 — job_trigger event_subject hint: drop the free-entry clause.
--
-- `job.entities.job_trigger.hints.event_subject` told users they could
-- "pick an available event OR TYPE an event name" — while the field is
-- `options_source:"census.emits"` with `allow_create:false`: a census
-- vocabulary is closed by definition and the combobox cannot create
-- values. The copy lied in all 7 languages. `target_subject`'s hint is
-- already correct ("Available destinations depend on the active
-- services") and is left untouched.

UPDATE job.translations SET value='The event that can trigger this trigger: when something happens in the system (e.g. a customer crosses a threshold) the trigger can run. Pick an available event from the list.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='en-GB' AND deleted_at IS NULL;
UPDATE job.translations SET value='The event that can trigger this trigger: when something happens in the system (e.g. a customer crosses a threshold) the trigger can run. Pick an available event from the list.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='en-US' AND deleted_at IS NULL;
UPDATE job.translations SET value='L''evento che può attivare questa trigger: quando succede qualcosa nel sistema (per esempio un cliente supera una soglia) la trigger può partire. Scegli un evento disponibile dall''elenco.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='it-IT' AND deleted_at IS NULL;
UPDATE job.translations SET value='Das Ereignis, das diese Trigger auslösen kann: wenn im System etwas passiert (z. B. ein Kunde überschreitet einen Schwellenwert), kann die Trigger starten. Ein verfügbares Ereignis aus der Liste wählen.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='de-DE' AND deleted_at IS NULL;
UPDATE job.translations SET value='L''événement qui peut déclencher cette déclencheur : quand quelque chose se produit dans le système (par ex. un client dépasse un seuil), la déclencheur peut partir. Choisir un événement disponible dans la liste.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='fr-FR' AND deleted_at IS NULL;
UPDATE job.translations SET value='El evento que puede activar esta trigger: cuando ocurre algo en el sistema (por ej. un cliente supera un umbral), la trigger puede ejecutarse. Elija un evento disponible de la lista.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='es-ES' AND deleted_at IS NULL;
UPDATE job.translations SET value='O evento que pode acionar esta trigger: quando algo acontece no sistema (por ex. um cliente ultrapassa um limite), a trigger pode correr. Escolha um evento disponível da lista.', updated_at=now(), updated_by='migration-trigger-hint-no-free-entry', version=version+1
  WHERE key='job.entities.job_trigger.hints.event_subject' AND language='pt-PT' AND deleted_at IS NULL;
