const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ivanbarivanbar035@gmail.com',
    pass: 'gixj jhkg gecr pmur'
  }
});

const sendVerificationEmail = async (userEmail, verificationCode) => {
  try {
    const mailOptions = {
      from: '"TryOn Hairstyle" <ivanbarivanbar035@gmail.com>',
      to: userEmail,
      subject: 'MyHairstyle - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="text-align: center; font-size: 16px;">Your verification code is:</p>
            <h1 style="text-align: center; color: #007bff; font-size: 36px; letter-spacing: 5px; margin: 20px 0;">
              ${verificationCode}
            </h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return {
      success: true,
      message: 'Verification code sent successfully'
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      message: 'This email address cannot receive mail. Please check your email address or try a different one.'
    };
  }
};

const sendWelcomeEmail = async (userEmail, fullname) => {
  const mailOptions = {
    from: '"TryOn Hairstyle" <ivanbarivanbar035@gmail.com>',
    to: userEmail,
    subject: 'Welcome to MyHairstyle!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to MyHairstyle!</h2>
        <p>Hello ${fullname},</p>
        <p>Thank you for registering with MyHairstyle. We're excited to have you join our community!</p>
        <p>You can now explore different hairstyles and find the perfect look for you.</p>
        <p>Best regards,<br>The MyHairstyle Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail
};
