import { connect, type NatsConnection, type JetStreamClient, type Msg } from "nats";

let nc: NatsConnection | null = null;
let js: JetStreamClient | null = null;

export async function getNatsConnection(): Promise<NatsConnection> {
  if (nc) return nc;
  
  const natsUrl = process.env.NATS_URL || "nats://127.0.0.1:4222";
  nc = await connect({ servers: natsUrl });
  js = nc.jetstream();
  
  console.log(`Connected to NATS at ${natsUrl}`);
  return nc;
}

export function getJetStream(): JetStreamClient {
  if (!js) {
    throw new Error("NATS JetStream not initialized. Call getNatsConnection() first.");
  }
  return js;
}

export async function closeNatsConnection(): Promise<void> {
  if (nc) {
    await nc.close();
    nc = null;
    js = null;
    console.log("NATS connection closed");
  }
}
