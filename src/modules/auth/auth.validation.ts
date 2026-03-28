import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const signupSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters')
      .max(30, 'First name cannot exceed 30 characters')
      .regex(/^[a-zA-Z]+$/, 'First name can only contain letters'),
    
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(2, 'Last name must be at least 2 characters')
      .max(30, 'Last name cannot exceed 30 characters')
      .regex(/^[a-zA-Z]+$/, 'Last name can only contain letters'),
    
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
      ),
    
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),

    isAcceptPrivacyStatement: z
      .boolean({ required_error: 'You must accept the Privacy Policy' })
      .refine(val => val === true, {
        message: 'You must accept the Privacy Policy to register',
      }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
    
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
  }),
});

export const recoverAccountSchema = z.object({
  body: z.object({
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
      ),
    
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

export const sendVerificationOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .toLowerCase()
      .trim(),
    
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers')
      .optional(),
  }),
});

export const verifyEmailWithTokenSchema = z.object({
  body: z.object({
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token cannot be empty'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token cannot be empty'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string({ required_error: 'Google ID token is required' }).min(10),
  }),
});
