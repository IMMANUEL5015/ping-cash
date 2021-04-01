const { SENDGRID_API_KEY } = process.env;

const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');

const template = (title, body) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <link href="https://fonts.googleapis.com/css?family=Roboto+Mono:400,500" rel="stylesheet">
    <style>
      * {font-family: Arial,Helvetica,sans-serif;}
      .container {width: 80%; max-width: 60em; margin: 0 auto;background: #fbfbfb;padding: 30px;color:#000}
      .message{font-size: 1rem;line-height: 1.5; color:#000}
    </style>
  </head>
  <body>
    <div class="container">
      <h2>${title}</h2>
      <p>${body}</p>
    </div>
  </body>
</html>`;

const sendMail = async (to, subject, content) => {
  const message = {
    from: process.env.EMAIL,
    to,
    html: content,
    subject
  };

  const transport = nodemailer.createTransport(
    nodemailerSendgrid({
      apiKey: SENDGRID_API_KEY
    })
  )

  return await transport.sendMail(message);
}

exports.sendRefCode = async (email, senderName, refCode) => {
  let title = 'Transaction Initialized';
  const body = `<p>Dear ${senderName}.</p>
    <p>Your transaction on PingCash has been successfully initialized.</p>
    <p>Please copy and paste the ref code provided below anytime you want to track or cancel this transaction.</p>
    <p>Reference: ${refCode}</p>`;
  const message = template(title, body);
  return await sendMail(email, title, message);
}

exports.sendPingLinkDetails = async (email, linkName, link, pin) => {
  let title = 'Ping Link Created';
  const body = `<p>${linkName}.</p>
  <p>You have successfully created your ping link.</p>
  <p>Anyone abroad can now pay you money using this link.</p>
  <p>For tracking your ping link, you would also need it's pin.</p>
  <p>Ping Link: ${link}</p>
  <p>Pin: ${pin}</p>`;
  const message = template(title, body);
  return await sendMail(email, title, message);
}

exports.emailNewUser = async (email, name, password) => {
  let title = 'PingCash Administrative Account Created';
  const body = `<h3>Hello ${name}.</h3>
  <p>The administrator of pingcash has created an account for you on the admin portal.</p>
  <p>Please proceed to the app to see the roles and privileges that have been assigned to you.</p>
  <p>The roles and privileges specify what it is you are allowed to do on the system.</p>
  <p>You can visit the app by clicking <a href='${process.env.ADMIN_URL}'>here</a></p>
  <p>Please login with the following email and password.</p>
  <p>email: ${email}</p>
  <p>password: ${password}</p>
  <p>Please feel free to reset your password whenever you want.</p>
  `;
  const message = template(title, body);
  return await sendMail(email, title, message);
}

exports.sendPasswordReset = async (user, resetUrl) => {
  let title = 'Password Reset';
  const body = `<h3>Hello ${user.name}.</h3>
  <p>Your password reset link. Valid for 10 minutes.</p>
  <p>${resetUrl}</p>
  <p>
  If you did not request to change your password, 
  please ignore this message and your password
  will remain unchanged. 
  </p>
  `;
  const message = template(title, body);
  return await sendMail(user.email, title, message);
}

exports.failedTransactionsEmail = async (user) => {
  const url = process.env.ADMIN_URL;
  let title = 'Failed Money Transfer';
  const body = `<h3>Hello ${user.name}.</h3>
  <p>Something went wrong when trying to transfer money to one of ping cash's customers.</p>
  <p>
  Please login to see the details of all failed transactions 
  </p>
  <p>
  <a href="${url}">${url}</a>. 
  </p>
  `;
  const message = template(title, body);
  return await sendMail(user.email, title, message);
}