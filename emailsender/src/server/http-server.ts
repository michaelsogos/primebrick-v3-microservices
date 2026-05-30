import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { WebhookService } from "../services/webhook-service.js";

const webhookService = new WebhookService();
const webhookApiKey = process.env.WEBHOOK_API_KEY;

if (!webhookApiKey) {
  throw new Error("WEBHOOK_API_KEY is not set");
}

export async function createHttpServer(port: number = 3003): Promise<void> {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    
    // Webhook endpoint
    if (url.pathname === "/webhook" && req.method === "POST") {
      // Check API key authentication
      const authHeader = req.headers["authorization"];
      const providedKey = authHeader?.replace("Bearer ", "") || authHeader?.replace("ApiKey ", "");
      
      if (providedKey !== webhookApiKey) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Unauthorized");
        return;
      }
      
      try {
        const provider = url.searchParams.get("provider") || "brevo";
        
        // Read request body
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }
        const body = Buffer.concat(chunks).toString();
        const payload = JSON.parse(body);
        
        await webhookService.handleWebhook(provider, payload);
        
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } catch (error) {
        console.error("Webhook error:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(error instanceof Error ? error.message : "Internal server error");
      }
      return;
    }
    
    // Health check endpoint
    if (url.pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
      return;
    }
    
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });
  
  server.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
}
