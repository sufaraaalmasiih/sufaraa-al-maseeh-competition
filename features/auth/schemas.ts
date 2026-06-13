import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح."),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف."),
});

export const registerTeamSchema = z.object({
  teamName: z.string().min(2, "اسم الفريق مطلوب."),
  governorate: z.string().min(2, "المحافظة مطلوبة."),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح."),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف."),
  player1: z.string().min(2, "اسم اللاعب الأول مطلوب."),
  player2: z.string().min(2, "اسم اللاعب الثاني مطلوب."),
  player3: z.string().min(2, "اسم اللاعب الثالث مطلوب."),
  player4: z.string().min(2, "اسم اللاعب الرابع مطلوب."),
  player5: z.string().min(2, "اسم اللاعب البديل مطلوب."),
  logo: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => !files?.length || files[0]?.type.startsWith("image/"),
      "الشعار يجب أن يكون صورة.",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterTeamInput = z.infer<typeof registerTeamSchema>;
