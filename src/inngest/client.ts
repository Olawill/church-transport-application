import { SendEmailSchema } from "@/features/email/emailSchema";
import { EventSchemas, Inngest } from "inngest";

type Events = {
  "app/email.notifications": {
    data: {
      values: SendEmailSchema;
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "actsOnWheels",
  schemas: new EventSchemas().fromRecord<Events>(),
});
