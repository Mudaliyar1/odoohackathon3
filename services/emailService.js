const brevo = require('../config/brevo');

const SENDER_EMAIL = process.env.SENDER_EMAIL;

const sendOtpEmail = async (toEmail, otp) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: "StockMaster" };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = "Your StockMaster OTP for Password Reset";
    sendSmtpEmail.htmlContent = `
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) for StockMaster password reset is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Regards,<br>StockMaster Team</p>
    `;

    try {
        await brevo.sendTransacEmail(sendSmtpEmail);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
};

const sendNotification = async (toEmail, subject, htmlContent) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: "StockMaster" };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    try {
        await brevo.sendTransacEmail(sendSmtpEmail);
        console.log('Notification email sent successfully');
    } catch (error) {
        console.error('Error sending notification email:', error);
        throw new Error('Failed to send notification email');
    }
};

module.exports = { sendOtpEmail, sendNotification };