import crypto from 'crypto';

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpiry = (): Date => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

export const isOTPExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate;
};

export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyOTP = (inputOtp: string, hashedOtp: string): boolean => {
  const hashedInput = hashOTP(inputOtp);
  return hashedInput === hashedOtp;
};
