import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { DriverAssignmentType } from "@/components/drivers/column";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EmailProps {
  openEmailDialog: boolean;
  setOpenEmailDialog: (open: boolean) => void;
  driverRequest: DriverAssignmentType;
}

interface WhatsAppProps {
  openWhatsAppDialog: boolean;
  setOpenWhatsAppDialog: (open: boolean) => void;
  driverRequest: DriverAssignmentType;
}

const formEmailSchema = z.object({
  body: z.string().min(2, {
    message: "Email body must be at least 2 characters.",
  }),
  subject: z.string().optional(),
});

const formWhatsAppSchema = z.object({
  message: z.string().min(2, {
    message: "Message must be at least 2 characters.",
  }),
});

export const DriverEmailDialog = ({
  openEmailDialog,
  setOpenEmailDialog,
  driverRequest,
}: EmailProps) => {
  const form = useForm<z.infer<typeof formEmailSchema>>({
    resolver: zodResolver(formEmailSchema),
    defaultValues: {
      body: "",
      subject: "Notification from Church Transport",
    },
  });

  const onSubmit = async (values: z.infer<typeof formEmailSchema>) => {
    try {
      const validated = formEmailSchema.safeParse(values);

      if (!validated.success) {
        toast.error(validated.error.message || "Please check your email body");
        return;
      }

      const { body, subject } = validated.data;

      // await NotificationService.notifyDriver(
      //   {
      //     body,
      //     to: driverRequest.email,
      //     subject: subject || "Notification from Church Transport",
      //   },
      //   "email"
      // );

      toast.success("Email sent successfully");
      form.reset({ body: "", subject: "" });
      setOpenEmailDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <Dialog open={openEmailDialog} onOpenChange={setOpenEmailDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Service</DialogTitle>
          <DialogDescription>
            This will send an email to the driver. Ensure you check the message
            before submitting the form.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter subject"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    NOTE: The subject field is optional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter email body here"
                      {...field}
                      disabled={form.formState.isSubmitting}
                      rows={8}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="space-x-2">
              <DialogClose className="border px-4 py-2 rounded-md h-9">
                Cancel
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export const DriverWhatsAppDialog = ({
  openWhatsAppDialog,
  setOpenWhatsAppDialog,
  driverRequest,
}: WhatsAppProps) => {
  const form = useForm<z.infer<typeof formWhatsAppSchema>>({
    resolver: zodResolver(formWhatsAppSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formWhatsAppSchema>) => {
    try {
      const validated = formWhatsAppSchema.safeParse(values);

      if (!validated.success) {
        toast.error(
          validated.error.message || "Please check your whatsApp message"
        );
        return;
      }

      const { message } = validated.data;

      const to = driverRequest.whatsappNumber ?? driverRequest.phone;

      if (!to) {
        toast.error("The driver does not have phone number on file.");
        return;
      }

      // await NotificationService.notifyDriver(
      //   { to, type: "text", text: message },
      //   "whatsapp"
      // );

      toast.success("whatsApp message sent successfully");
      form.reset();
      setOpenWhatsAppDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <Dialog open={openWhatsAppDialog} onOpenChange={setOpenWhatsAppDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your WhatsApp Message here...</DialogTitle>
          <DialogDescription>
            This will send a whatsApp message to the driver. Ensure you check
            the message before submitting the form.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter whatsApp message here"
                      {...field}
                      rows={8}
                      className="resize-none"
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="space-x-2">
              <DialogClose className="border px-4 py-2 rounded-md h-9 cursor-pointer">
                Cancel
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
