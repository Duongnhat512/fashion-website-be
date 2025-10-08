interface IOtpService {
  setOtp: (email: string, otp: number) => Promise<void>;
  verifyOtp: (email: string, otp: number) => Promise<boolean>;
  generateOtp: () => number;
}

export default IOtpService;
