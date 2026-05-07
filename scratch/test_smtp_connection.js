/**
 * SMTP Connection Test Script
 * 
 * This script tests the SMTP connection to verify if email sending is working.
 * Run with: node scratch/test_smtp_connection.js
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTPConnection() {
  console.log('🔍 Testing SMTP Connection...\n');
  
  console.log('📋 Configuration:');
  console.log('  HOST:', process.env.EMAIL_HOST);
  console.log('  PORT:', process.env.EMAIL_PORT);
  console.log('  SECURE:', process.env.EMAIL_SECURE);
  console.log('  USER:', process.env.EMAIL_USER);
  console.log('  PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
  console.log('');

  // Check if credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS not set in .env file');
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });

  try {
    console.log('🔌 Attempting to connect to SMTP server...\n');
    
    // Verify connection
    await transporter.verify();
    
    console.log('\n✅ SUCCESS: SMTP connection verified!');
    console.log('📧 Email server is ready to send messages.\n');

    // Try sending a test email
    console.log('📤 Sending test email...\n');
    
    const info = await transporter.sendMail({
      from: `"MY EMDR Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'SMTP Test - MY EMDR',
      text: 'This is a test email from MY EMDR SMTP configuration test.',
      html: '<p>This is a <strong>test email</strong> from MY EMDR SMTP configuration test.</p>',
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n🎉 All tests passed! Email system is working correctly.\n');

  } catch (error) {
    console.error('\n❌ SMTP CONNECTION FAILED\n');
    console.error('Error Details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('  Command:', error.command);
    console.error('');

    // Provide specific troubleshooting advice
    if (error.code === 'EAUTH') {
      console.error('🔐 AUTHENTICATION ERROR:');
      console.error('   - Your Gmail App Password may be invalid or expired');
      console.error('   - Make sure you are using an App Password, not your regular Gmail password');
      console.error('   - Generate a new App Password at: https://myaccount.google.com/apppasswords');
      console.error('   - Ensure 2-Step Verification is enabled on your Google account');
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      console.error('🌐 CONNECTION ERROR:');
      console.error('   - Check your internet connection');
      console.error('   - Firewall or antivirus may be blocking SMTP port 587');
      console.error('   - Try using port 465 with secure: true');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 CONNECTION REFUSED:');
      console.error('   - SMTP server is not accepting connections');
      console.error('   - Check if EMAIL_HOST and EMAIL_PORT are correct');
    }

    console.error('');
    process.exit(1);
  }
}

// Run the test
testSMTPConnection();
