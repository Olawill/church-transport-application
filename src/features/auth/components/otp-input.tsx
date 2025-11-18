"use client";

import { Clock, Mail, MessageSquare, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OTPInputProps {
  type: "email" | "phone";
  identifier: string;
  onVerified: (success: boolean) => void;
  onResendOTP?: () => void;
}

export const OTPInput = ({
  type,
  identifier,
  onVerified,
  onResendOTP,
}: OTPInputProps) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every((digit) => digit !== "") && !loading) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    if (newOtp.every((digit) => digit !== "")) {
      verifyOTP(newOtp.join(""));
    }
  };

  const verifyOTP = async (code: string) => {
    if (attempts >= 3) {
      toast.error("Too many failed attempts. Please request a new code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type: type === "email" ? "EMAIL_VERIFICATION" : "PHONE_VERIFICATION",
          identifier,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification successful!");
        onVerified(true);
      } else {
        setAttempts((prev) => prev + 1);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        toast.error(data.message || "Invalid verification code");

        if (attempts >= 2) {
          toast.error("Maximum attempts reached. Please request a new code.");
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (onResendOTP) {
      onResendOTP();
      setTimeLeft(300);
      setAttempts(0);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <Shield className="w-5 h-5 mr-2" />
          Verify Your {type === "email" ? "Email" : "Phone"}
        </CardTitle>
        <CardDescription className="text-center">
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="font-medium">
            {type === "email" ? identifier : `****${identifier.slice(-4)}`}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-center block mb-2">
            Enter Verification Code
          </Label>
          <div className="flex justify-center space-x-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-bold border-2"
                disabled={loading || timeLeft === 0}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            Time remaining: {formatTime(timeLeft)}
          </div>

          {attempts > 0 && (
            <Alert>
              <AlertDescription>
                {attempts >= 3
                  ? "Maximum attempts reached. Please request a new code."
                  : `${3 - attempts} attempts remaining`}
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            onClick={handleResend}
            disabled={timeLeft > 0 || loading}
            className="w-full"
          >
            {type === "email" ? (
              <Mail className="w-4 h-4 mr-2" />
            ) : (
              <MessageSquare className="w-4 h-4 mr-2" />
            )}
            {timeLeft > 0
              ? `Resend in ${formatTime(timeLeft)}`
              : `Resend Code via ${type === "email" ? "Email" : "SMS"}`}
          </Button>
        </div>

        <Alert>
          <Shield className="size-4" />
          <AlertDescription>
            For security purposes, this code will expire in{" "}
            {formatTime(timeLeft)}. If you don&apos;t receive the code, check
            your spam folder or try resending.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
