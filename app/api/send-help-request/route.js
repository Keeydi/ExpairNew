import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Create a transporter object using your email service provider's SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail", // You can use other services like 'Hotmail', 'Outlook', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const subject = formData.get("subject");
    const message = formData.get("message");
    const photo = formData.get("photo");

    // Construct the email body
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "expaircs@gmail.com", 
      subject: `Help Request from Expair: ${subject}`,
      html: `
        <h3>New Help Request</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // If a photo was uploaded, attach it to the email
    if (photo && photo.size > 0) {
      const photoBuffer = Buffer.from(await photo.arrayBuffer());
      mailOptions.attachments = [
        {
          filename: photo.name,
          content: photoBuffer,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: error.message },
      { status: 500 }
    );
  }
}