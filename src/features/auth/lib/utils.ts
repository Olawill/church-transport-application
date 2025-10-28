import { PASSWORD_LENGTH } from "@/schemas/authSchemas";

type PasswordFeedback = {
  strength: "weak" | "good" | "strong";
  errors: string[];
};

export const passwordStrength = (password: string): PasswordFeedback => {
  const errors: string[] = [];

  if (password.length < PASSWORD_LENGTH) {
    errors.push("be at least 8 characters");
    console.log(errors);
  }
  if (!/[a-z]/.test(password)) {
    errors.push("have at least one lowercase letter");
    console.log(errors);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("have at least one uppercase letter");
    console.log(errors);
  }
  if (!/\d/.test(password)) {
    errors.push("have at least one number");
    console.log(errors);
  }
  if (!/[\W_]/.test(password)) {
    errors.push("have at least a special character");
    console.log(errors);
  }

  if (errors.length === 0) return { strength: "strong", errors };

  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasUpperOrSpecial = /[A-Z]/.test(password) || /[\W_]/.test(password);

  if (hasLength && hasLetter && hasNumber && hasUpperOrSpecial) {
    return { strength: "good", errors };
  }

  return { strength: "weak", errors };
};
