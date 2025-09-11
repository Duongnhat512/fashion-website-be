import redis from '../../config/redis.config';
import IOtpService from '../otp.service.interface';

export class OtpService implements IOtpService {
  generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  setOtp = async (email: string, otp: number) => {
    const key = `otp:${email}`;
    await redis.set(key, otp.toString(), 'EX', 300);
  };

  verifyOtp = async (email: string, otp: number) => {
    const key = `otp:${email}`;
    const storedOtp = await redis.get(key);
    if (storedOtp === otp.toString()) {
      return true;
    }
    return false;
  };
}
