export const otpHtmlContent = (otp: string) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 50px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
              text-align: center;
              padding-bottom: 20px;
          }
          .header h1 {
              margin: 0;
              font-size: 24px;
              color: #333333;
          }
          .content {
              text-align: center;
          }
          .content p {
              font-size: 16px;
              color: #666666;
              line-height: 1.5;
          }
          .otp-code {
              display: inline-block;
              background-color: #f0f0f0;
              padding: 10px 20px;
              font-size: 24px;
              letter-spacing: 4px;
              border-radius: 4px;
              margin: 20px 0;
              color: #333333;
          }
          .footer {
              text-align: center;
              padding-top: 20px;
              font-size: 14px;
              color: #999999;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>OTP Verification</h1>
          </div>
          <div class="content">
              <p>Hello,</p>
              <p>We received a request to set up your email for OTP verification. Please use the OTP code below to complete the process:</p>
              <div class="otp-code">${otp}</div>
              <p>If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer">
              <p>Thank you,</p>
              <p>Pepoz app</p>
          </div>
      </div>
  </body>
  </html>
`;
};

export const resetPasswordOtpHtmlContent = (otp: string) => {
    return `
    <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333333;
        }
        .content {
            text-align: center;
        }
        .content p {
            font-size: 16px;
            color: #666666;
            line-height: 1.5;
        }
        .otp-code {
            display: inline-block;
            background-color: #f0f0f0;
            padding: 10px 20px;
            font-size: 24px;
            letter-spacing: 4px;
            border-radius: 4px;
            margin: 20px 0;
            color: #333333;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            font-size: 14px;
            color: #999999;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your account. Please use the OTP code below to reset your password:</p>
            <div class="otp-code">${otp}</div>
            <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Thank you,</p>
            <p>❤️ Pepoz Team</p>
        </div>
    </div>
</body>

</html>
  `;
  };


export const resetPasswordHtmlContent = (resetLink: string) => {
  return `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .email-container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            padding: 20px;
            text-align: left;
            line-height: 1.6;
        }
        .content p {
            font-size: 16px;
            color: #666666;
        }
        .reset-link {
            display: inline-block;
            background-color: #28a745;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 25px;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .reset-link:hover {
            background-color: #218838;
        }
        .footer {
            background-color: #f4f4f9;
            text-align: center;
            padding: 10px 20px;
            font-size: 14px;
            color: #999999;
        }
        .footer p {
            margin: 5px 0;
        }
        @media (max-width: 600px) {
            .header h1 {
                font-size: 24px;
            }
            .content p {
                font-size: 14px;
            }
            .reset-link {
                padding: 10px 20px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. Please click the button below to reset your password:</p>
            <a href="${resetLink}" class="reset-link">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Thank you,</p>
            <p>Your Company Name</p>
        </div>
    </div>
</body>
</html>

`;
};
