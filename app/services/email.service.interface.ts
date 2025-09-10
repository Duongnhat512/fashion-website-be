export interface IEmailService {
  handleSendEmail: (
    receiverEmail: string,
    subject: string,
    html: string,
  ) => Promise<void>;
  readHtmlTemplate: (templatename: string, data: any) => Promise<string>;
}
