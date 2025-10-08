import * as nodemailer from 'nodemailer';
import { IEmailService } from '../email.service.interface';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import path from 'path';
import { config } from '../../../config/env';

export class EmailService implements IEmailService {
  async handleSendEmail(
    receiverEmail: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });

    const mailOptions = {
      from: config.email.user,
      to: receiverEmail,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  async readHtmlTemplate(templatename: string, data: any) {
    try {
      const templatePath = path.join(
        __dirname,
        '../..',
        'html',
        `${templatename}.html`,
      );
      const htmlSource = readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(htmlSource);
      const html = template(data);

      return html;
    } catch (error) {
      throw new Error('Failed to read HTML template');
    }
  }
}
