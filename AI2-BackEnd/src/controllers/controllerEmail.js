const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure you have this line to load environment variables from a .env file

//em caso de erro, instalar as dependências necessárias:
// npm install nodemailer 

// Configure the nodemailer transport object
const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAILRU_USER,
        pass: process.env.MAILRU_PASS
    }
});

/**
 * Send an email.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @route POST /email/send
 * @returns {void}
 */
const sendEmail = (req, res) => {
    const { to, subject, body } = req.body;
    console.log('to:', to);
    console.log('subject:', subject);
    console.log('body:', body);

    if (!to || !subject || !body) {
        return res.status(400).send('Missing required fields: to, subject, or body');
    }

    const mailOptions = {
        from: process.env.MAILRU_USER,
        to,
        subject,
        text: body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        }
        console.log('Email sent:', info.response);
        res.status(200).send('Email sent successfully');
    });
};

const sendMail = async ({ to, subject, body }) => {
    const mailOptions = {
        from: process.env.MAILRU_USER,
        to,
        subject,
        html: body // Use 'html' if you are sending HTML content
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return reject('Error sending email');
            }
            console.log('Email sent:', info.response);
            resolve('Email sent successfully');
        });
    });
};

module.exports = { sendEmail, sendMail };

