import { z } from 'zod';

export const nameRegex = /^[a-zA-Z\s'-]+$/;
export const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/]/;
export const uppercaseRegex = /[A-Z]/;
export const lowercaseRegex = /[a-z]/;
export const numberRegex = /[0-9]/;

export const emailSchema = z
  .string()
  .min(1, 'E-mail é obrigatório')
  .email('Formato de e-mail inválido')
  .max(254, 'E-mail muito longo')
  .transform((val) => val.toLowerCase().trim());

export const nameSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .regex(nameRegex, 'Nome contém caracteres inválidos');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .refine((val) => uppercaseRegex.test(val), 'A senha deve conter pelo menos uma letra maiúscula')
  .refine((val) => lowercaseRegex.test(val), 'A senha deve conter pelo menos uma letra minúscula')
  .refine((val) => numberRegex.test(val), 'A senha deve conter pelo menos um número')
  .refine((val) => specialCharRegex.test(val), 'A senha deve conter pelo menos um caractere especial');

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos de serviço'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.password.toLowerCase() !== data.email.toLowerCase(), {
    message: 'A senha não pode ser igual ao e-mail',
    path: ['password'],
  })
  .refine((data) => data.password.toLowerCase() !== data.name.toLowerCase(), {
    message: 'A senha não pode ser igual ao nome',
    path: ['password'],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

export const apiKeySchema = z.object({
  provider: z.literal('gemini'),
  apiKey: z
    .string()
    .min(1, 'A chave de API é obrigatória')
    .refine((val) => val.startsWith('AIzaSy'), 'Chave de API do Gemini inválida (deve iniciar com AIzaSy)'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ApiKeyInput = z.infer<typeof apiKeySchema>;
