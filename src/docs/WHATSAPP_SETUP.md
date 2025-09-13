# WhatsApp Cloud API Integration Setup Guide

This guide provides comprehensive instructions for setting up WhatsApp Cloud API integration with your Church Transportation Team application.

## Prerequisites

- Facebook Developer Account
- Facebook Business Account
- WhatsApp Business Account
- Phone number for WhatsApp Business (not currently used on personal WhatsApp)

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in app details:
   - App Name: "Church Transportation Notifications"
   - Contact Email: Your church email
   - Business Account: Select your business account
5. Click "Create App"

## Step 2: Add WhatsApp Product

1. In your app dashboard, scroll down to "Add Products to Your App"
2. Find "WhatsApp" and click "Set up"
3. Accept the WhatsApp Business Platform terms
4. Complete the setup process

## Step 3: Configure WhatsApp Business Account

1. In the WhatsApp section, go to "API Setup"
2. Select your WhatsApp Business Account or create a new one
3. Add a phone number for your WhatsApp Business Account
4. Verify the phone number by following the SMS verification process

## Step 4: Generate Access Tokens

1. In the API Setup page, you'll see:

   - **Temporary Access Token**: Valid for 24 hours (for testing)
   - **Phone Number ID**: Used to send messages
   - **WhatsApp Business Account ID**: Your account identifier

2. For production, you'll need to generate a System User Access Token:
   - Go to Business Settings > System Users
   - Create a new system user for your app
   - Assign the WhatsApp Business Management permission
   - Generate a token with never-expiring option

## Step 5: Configure Webhooks

1. In WhatsApp > Configuration, set up webhooks:
   - Webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Verify Token: Generate a secure token
2. Subscribe to webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`

## Step 6: Environment Configuration

Add the following environment variables to your `.env.local` file:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_webhook_token_here
WHATSAPP_API_VERSION=v18.0
```

## Step 7: Message Templates

Create message templates in Facebook Business Manager:

### Template 1: Pickup Request Accepted

```
Name: pickup_accepted
Category: ACCOUNT_UPDATE
Language: English (US)

Message:
Hello {{1}}, your pickup request for {{2}} on {{3}} has been accepted!
Your driver {{4}} will contact you shortly.
Driver contact: {{5}}

Variables:
1. User first name
2. Service name
3. Service date
4. Driver name
5. Driver phone
```

### Template 2: Pickup Reminder

```
Name: pickup_reminder
Category: ACCOUNT_UPDATE
Language: English (US)

Message:
Reminder: Your pickup for {{1}} is scheduled for {{2}}.
Your driver {{3}} will arrive at {{4}} approximately 30 minutes before service.
Contact driver: {{5}}

Variables:
1. Service name
2. Pickup time
3. Driver name
4. Pickup address
5. Driver phone
```

## Step 8: Implementation in Application

### Webhook Handler

Create `app/api/webhooks/whatsapp/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process incoming WhatsApp messages/status updates
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Handle different webhook events here
    // - Message received
    // - Message delivered
    // - Message read

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### WhatsApp Service

Create `lib/whatsapp.ts`:

```typescript
interface WhatsAppMessage {
  to: string;
  template: string;
  components: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN!;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: string[]
  ) {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    const message: WhatsAppMessage = {
      to: to.replace(/\D/g, ""), // Remove non-digits
      template: templateName,
      components: [
        {
          type: "body",
          parameters: parameters.map((param) => ({
            type: "text",
            text: param,
          })),
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to,
          type: "template",
          template: {
            name: message.template,
            language: {
              code: "en_US",
            },
            components: message.components,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  async notifyPickupAccepted(
    userPhone: string,
    userName: string,
    serviceName: string,
    serviceDate: string,
    driverName: string,
    driverPhone: string
  ) {
    return this.sendTemplateMessage(userPhone, "pickup_accepted", [
      userName,
      serviceName,
      serviceDate,
      driverName,
      driverPhone,
    ]);
  }

  async sendPickupReminder(
    userPhone: string,
    serviceName: string,
    pickupTime: string,
    driverName: string,
    pickupAddress: string,
    driverPhone: string
  ) {
    return this.sendTemplateMessage(userPhone, "pickup_reminder", [
      serviceName,
      pickupTime,
      driverName,
      pickupAddress,
      driverPhone,
    ]);
  }
}

export const whatsappService = new WhatsAppService();
```

## Step 9: Testing

### Test Message Sending

1. Use the temporary access token for initial testing
2. Send a test message using the Graph API Explorer
3. Verify messages are received on the test phone number

### Test Webhooks

1. Use ngrok or similar tool to expose your local server
2. Configure the webhook URL to point to your local endpoint
3. Send messages and verify webhook events are received

## Step 10: Production Deployment

1. **Domain Verification**: Verify your production domain in Facebook Business Manager
2. **Update Webhook URL**: Change webhook URL to production endpoint
3. **Rate Limits**: Be aware of WhatsApp API rate limits:
   - 1,000 messages per day for new business accounts
   - Limits increase based on phone number quality rating
4. **Phone Number Display Name**: Set a display name for your business phone number
5. **Privacy Policy**: Ensure your privacy policy covers WhatsApp messaging

## Step 11: App Review (If Required)

For certain advanced features, you may need app review:

1. Submit app for review in Facebook App Dashboard
2. Provide detailed use case description
3. Include demo video showing the integration
4. Wait for approval (usually 1-2 weeks)

## Security Best Practices

1. **Secure Webhook**: Verify webhook signatures
2. **Token Storage**: Store access tokens securely (environment variables)
3. **Input Validation**: Validate all incoming webhook data
4. **Rate Limiting**: Implement rate limiting for outgoing messages
5. **Error Handling**: Implement comprehensive error handling and logging

## Monitoring and Analytics

1. **Message Delivery**: Track message delivery rates
2. **User Engagement**: Monitor read receipts and response rates
3. **Error Rates**: Monitor API errors and failed deliveries
4. **Usage Analytics**: Track message volume and patterns

## Troubleshooting Common Issues

### Issue 1: Messages Not Sending

- Check access token validity
- Verify phone number format (international format without '+')
- Ensure message template is approved

### Issue 2: Webhook Not Receiving Events

- Verify webhook URL is accessible from Facebook servers
- Check verify token matches configuration
- Ensure webhook returns 200 status for verification

### Issue 3: Template Messages Rejected

- Verify template is approved in Business Manager
- Check template parameter count and order
- Ensure language code matches template language

## Support Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [Facebook Developer Community](https://developers.facebook.com/community/)
- [WhatsApp Business API Support](https://business.facebook.com/business/help/support)

---

**Note**: This integration provides a foundation for WhatsApp notifications. The current application includes placeholder functions that can be activated once you complete the WhatsApp Cloud API setup following this guide.
