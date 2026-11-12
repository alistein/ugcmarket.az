import { z } from "zod";

/**
 * Auth forms. Messages are i18n keys (validation.*). Password rules mirror Supabase
 * (supabase/config.toml: minimum_password_length = 8, letters_digits) — change both together.
 */
export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("validation.email").max(254, "validation.email"));

export const NewPassword = z
  .string()
  .min(8, "validation.passwordMin")
  .max(72, "validation.passwordMax") // bcrypt limit
  .regex(/\p{L}/u, "validation.passwordLetter")
  .regex(/\d/, "validation.passwordDigit");

export const OtpCode = z
  .string()
  .transform((v) => v.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "validation.otp"));

export const LoginPasswordInput = z.object({
  email: Email,
  password: z.string().min(1, "validation.required").max(72, "validation.passwordMax"),
});
export type LoginPasswordInput = z.infer<typeof LoginPasswordInput>;

export const SignupInput = z.object({ email: Email, password: NewPassword });
export type SignupInput = z.infer<typeof SignupInput>;

export const EmailInput = z.object({ email: Email });
export type EmailInput = z.infer<typeof EmailInput>;

export const CodeInput = z.object({ code: OtpCode });
export type CodeInput = z.input<typeof CodeInput>;

export const SetPasswordInput = z
  .object({ password: NewPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "validation.passwordMismatch" });
export type SetPasswordInput = z.infer<typeof SetPasswordInput>;

export const OnboardingRole = z.enum(["brand", "creator"]);
export type OnboardingRole = z.infer<typeof OnboardingRole>;
