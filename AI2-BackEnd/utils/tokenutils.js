const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require('dotenv').config();

//for mobile
const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
// const iv = Buffer.from(process.env.ENCRYPTION_IV, "base64");
//const key = crypto.randomBytes(32); // 256-bit key
const iv = crypto.randomBytes(16); // 128-bit IV

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    // console.log("Encrypting:");
    // console.log("IV:", iv.toString("hex"));
    // console.log("Encrypted Data:", encrypted);
  
    return { iv: iv.toString("hex"), encryptedData: encrypted };
  };
// const encrypt = (text) => {
//     const cipher = crypto.createCipheriv(algorithm, key, iv);
//     let encrypted = cipher.update(text);
//     encrypted = Buffer.concat([encrypted, cipher.final()]);
//     console.log("Encrypting:");
//     console.log("IV:", iv.toString("hex"));
//     console.log("Encrypted Data:", encrypted.toString("hex"));
//     return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
//   };
const decrypt = (text) => {
  console.log("Decrypting:", text);
  try {
    if (typeof text === 'string') {
      text = JSON.parse(text);
    }
    if (!text || !text.iv || !text.encryptedData) {
      throw new Error("Invalid input for decryption");
    }
    
    let iv = Buffer.from(text.iv, "hex");
    let encryptedText = Buffer.from(text.encryptedData, "base64");
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    //console.log("After decrypting: " + decrypted);
    return decrypted;
  } catch (e) {
    console.error("Decryption error:", e);
    return null;
  }
};



const generateToken = (id) => {
  console.log(process.env.JWT_TOKEN_EXPIRATION);

  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn:  process.env.JWT_TOKEN_EXPIRATION});

  console.log('token gerado: ' + token);   
  return encrypt(token);
};
const generateTokenAccountCreation_resetpasword = (id) => {
  console.log(process.env.JWT_TOKEN_EXPIRATION);

  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn:  1300});

  console.log('token account creation/reset passwrd gerado: ' + token);   
  return encrypt(token);
};

const generateTokenFor1stLog = (id) => {
  console.log(process.env.JWT_TOKEN_EXPIRATION);

  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn:  '30m'});

  console.log('token 1st login gerado: ' + token);   
  return encrypt(token);
};

const generateRefreshToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });
  return encrypt(token);
};

const verifyToken = (encryptedToken) => {
  try {
    //console.log("Verifying Token:", encryptedToken);
    const decryptedToken = decrypt(encryptedToken);
    return jwt.verify(decryptedToken, process.env.JWT_SECRET);
  }
   catch (error) {
    if(error instanceof jwt.TokenExpiredError){
      console.log("Token expired");
      throw error;
    }
    console.error("Verification error:", error);
    return null;
  }
};

const verifyRefreshToken = (encryptedToken) => {
  try {
    const decryptedToken = decrypt(encryptedToken);

    if (!decryptedToken) {
      throw new Error("Decryption failed");
    }

    return jwt.verify(decryptedToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    console.log('Error inside verifyRefresh:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateTokenFor1stLog,
  generateTokenAccountCreation_resetpasword,
};

