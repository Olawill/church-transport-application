import bcrypt from "bcryptjs";

export const comparePassword = async (
  password: string,
  confirmPassword: string
) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await bcrypt.compare(confirmPassword, hashedPassword);
};
