import { Request, Response } from 'express';
import { IAuthService } from '../services/auth/auth.service.interface';
import { AuthService } from '../services/auth/implements/auth.service.implement';
import { LoginRequestDto } from '../dtos/request/user/user.request.dto';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { IEmailService } from '../services/email/email.service.interface';
import { EmailService } from '../services/email/implements/email.service.implement';
import { OtpService } from '../services/otp/implements/opt.service.implement';
import IOtpService from '../services/otp/otp.service.interface';

export class AuthController {
  private readonly authService: IAuthService;
  private readonly emailService: IEmailService;
  private readonly otpService: IOtpService;
  constructor() {
    this.authService = new AuthService();
    this.emailService = new EmailService();
    this.otpService = new OtpService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginDto = new LoginRequestDto();
      Object.assign(loginDto, req.body);

      const errors = await validate(loginDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const result = await this.authService.login(loginDto);

      res.status(200).json(ApiResponse.success('Đăng nhập thành công', result));
    } catch (error) {
      res
        .status(500)
        .json(ApiResponse.error('Thông tin đăng nhập không chính xác.'));
    }
  };

  async sendOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      const otp = this.otpService.generateOtp();
      this.otpService.setOtp(email, otp);

      const htmlTemplate = await this.emailService.readHtmlTemplate(
        'email_template',
        {
          otp,
          username: email.split('@')[0],
        },
      );
      const emailData = {
        to: email,
        subject: 'Mã OTP xác thực tài khoản - BooBoo',
        html: htmlTemplate,
      };
      await this.emailService.handleSendEmail(
        emailData.to,
        emailData.subject,
        emailData.html,
      );

      res
        .status(200)
        .json(
          ApiResponse.success(
            'Mã OTP đã được gửi. Vui lòng kiểm tra email của bạn!',
          ),
        );
    } catch (error) {
      console.error(error);
      res.status(500).json(ApiResponse.error('Lỗi khi gửi OTP'));
    }
  }

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { email, otp } = req.body;
    try {
      const isValidOtp = await this.otpService.verifyOtp(email, otp);

      if (!isValidOtp) {
        res.status(400).json(ApiResponse.error('Mã OTP không hợp lệ'));
        return;
      }

      const verificationToken =
        this.authService.generateVerificationToken(email);

      res.status(200).json(
        ApiResponse.success('Mã OTP đã được xác thực', {
          verificationToken,
        }),
      );
    } catch (error) {
      res.status(500).json(ApiResponse.error('Lỗi khi xác thực OTP'));
    }
  };
}
