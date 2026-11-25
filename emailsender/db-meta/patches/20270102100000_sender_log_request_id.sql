-- Primebrick: sender_log becomes the taken-charge record of the durable
-- emailsender.send work item. `request_id` is the transport correlation
-- key — UNIQUE is the domain-native dedupe backstop (the systemic Redis
-- dedupe in jetstreamSubscribe is the first net): a redelivered fire can
-- never write a second pending row for the same logical send. Nullable —
-- rows predating the durable migration carry no request id.
-- `request_payload` captures the full original request verbatim: the
-- taken-charge write must carry everything the asynchronous dispatch
-- needs, so execution never depends on the original NATS message.
ALTER TABLE "emailsender"."sender_log"
  ADD COLUMN "request_id" varchar(100) NULL,
  ADD COLUMN "request_payload" jsonb NULL,
  ADD CONSTRAINT "sender_log_request_id_key" UNIQUE ("request_id");
