const sgMail = require('@sendgrid/mail');

const confirmMsg = (email, verificationToken) => {
  sgMail.setApiKey(process.env.SENDGRID_API);
  const msg = {
    to: email, // Change to your recipient
    from: 'zhman@ukr.net', // Change to your verified sender
    subject: 'Verification email',
    text: `Confirm your email: http://localhost:3000/api/auth/users/verify/${verificationToken}`,
    html: `Confirm your email: http://localhost:3000/api/auth/users/verify/${verificationToken}`,
  }
  sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent')
  })
  .catch((error) => {
    console.error(error)
  })
}

module.exports = {
    confirmMsg
}