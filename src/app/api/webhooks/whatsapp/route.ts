import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Webhook verification for WhatsApp
export const GET = async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("WhatsApp webhook verification:", {
    mode,
    token: token ? "[REDACTED]" : null,
    challenge,
  });

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    console.log("WhatsApp webhook verified successfully");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.log("WhatsApp webhook verification failed");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
};

// Handle incoming WhatsApp messages and status updates
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Process different types of webhook events
    if (body?.entry) {
      for (const entry of body.entry) {
        if (entry?.changes) {
          for (const change of entry.changes) {
            if (change?.field === "messages") {
              await handleMessageChange(change.value);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

const handleMessageChange = async (messageData: any) => {
  try {
    // Handle different message types
    if (messageData?.messages) {
      for (const message of messageData.messages) {
        console.log("Received message:", {
          from: message.from,
          type: message.type,
          timestamp: message.timestamp,
        });

        // Process incoming messages (e.g., replies from users)
        await processIncomingMessage(message, messageData.metadata);
      }
    }

    // Handle message status updates (delivered, read, etc.)
    if (messageData?.statuses) {
      for (const status of messageData.statuses) {
        console.log("Message status update:", {
          id: status.id,
          status: status.status,
          timestamp: status.timestamp,
        });

        await processMessageStatus(status);
      }
    }
  } catch (error) {
    console.error("Error handling message change:", error);
  }
};

const processIncomingMessage = async (message: any, metadata: any) => {
  // Here you can implement logic to handle incoming messages
  // For example:
  // - Process user replies to pickup confirmations
  // - Handle stop/unsubscribe requests
  // - Log message receipts for audit purposes

  console.log("Processing incoming message:", {
    messageId: message.id,
    from: message.from,
    type: message.type,
    phoneNumberId: metadata?.phone_number_id,
  });

  // Example: Handle text messages
  if (message.type === "text") {
    const text = message.text?.body?.toLowerCase();

    if (text?.includes("stop") || text?.includes("unsubscribe")) {
      console.log("User requested to stop notifications:", message.from);
      // TODO: Implement unsubscribe logic
      // - Mark user as unsubscribed in database
      // - Send confirmation message
    } else if (text?.includes("help")) {
      console.log("User requested help:", message.from);
      // TODO: Send help information
    }
  }
};

const processMessageStatus = async (status: any) => {
  // Handle message delivery status updates
  // This is useful for tracking message delivery success/failure

  console.log("Processing message status:", {
    messageId: status.id,
    status: status.status,
    recipientId: status.recipient_id,
  });

  // TODO: Update database with message delivery status
  // - Track successful deliveries
  // - Handle failed deliveries
  // - Update user notification preferences if needed
};
