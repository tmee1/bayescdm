'use server';

import { prisma } from '@/lib/db';

interface ApplicationData {
  userId: string;
  clinicalRole: string;
  specialty: string;
  institution: string | null;
  yearsPractice: number | null;
  licenseOrNPI: string | null;
  justification: string;
}

interface ApplicationResult {
  success: boolean;
  applicationId?: string;
  error?: string;
}

// Admin email for notifications
const ADMIN_EMAIL = 'thomasmee777@gmail.com';

export async function submitReviewerApplication(data: ApplicationData): Promise<ApplicationResult> {
  try {
    // Check if user already has a pending application
    const existingApplication = await prisma.reviewerApplication.findFirst({
      where: {
        userId: data.userId,
        status: 'PENDING',
      },
    });

    if (existingApplication) {
      return { success: false, error: 'You already have a pending application' };
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Create the application
    const application = await prisma.reviewerApplication.create({
      data: {
        userId: data.userId,
        clinicalRole: data.clinicalRole,
        specialty: data.specialty,
        institution: data.institution,
        yearsPractice: data.yearsPractice,
        licenseOrNPI: data.licenseOrNPI,
        justification: data.justification,
        status: 'PENDING',
      },
    });

    // Update user's reviewer status to APPLIED
    await prisma.user.update({
      where: { id: data.userId },
      data: { reviewerStatus: 'APPLIED' },
    });

    // Send email notification to admin
    await sendAdminNotification({
      applicationId: application.id,
      applicantName: user.name || 'Unknown',
      applicantEmail: user.email || 'Unknown',
      clinicalRole: data.clinicalRole,
      specialty: data.specialty,
      institution: data.institution,
      yearsPractice: data.yearsPractice,
      justification: data.justification,
    });

    return { success: true, applicationId: application.id };
  } catch (error) {
    console.error('Application submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

interface NotificationData {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  clinicalRole: string;
  specialty: string;
  institution: string | null;
  yearsPractice: number | null;
  justification: string;
}

async function sendAdminNotification(data: NotificationData): Promise<void> {
  // Get the base URL for the review link
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  const reviewUrl = `${baseUrl}/admin/reviewer-applications/${data.applicationId}`;

  // Check if email is configured
  const emailConfigured = process.env.EMAIL_SERVER_HOST && 
                          process.env.EMAIL_SERVER_USER && 
                          process.env.EMAIL_SERVER_PASSWORD;

  if (emailConfigured) {
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@bayes-bedside.com',
        to: ADMIN_EMAIL,
        subject: `[Bayes at the Bedside] New Reviewer Application: ${data.applicantName}`,
        html: `
          <h2>New Reviewer Application</h2>
          <p>A new reviewer application has been submitted.</p>
          
          <h3>Applicant Details</h3>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.applicantName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.applicantEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Role</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.clinicalRole}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Specialty</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.specialty}</td>
            </tr>
            ${data.institution ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Institution</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.institution}</td>
            </tr>
            ` : ''}
            ${data.yearsPractice ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Years Experience</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.yearsPractice}</td>
            </tr>
            ` : ''}
          </table>
          
          <h3>Justification</h3>
          <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">${data.justification}</p>
          
          <p style="margin-top: 24px;">
            <a href="${reviewUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Review Application
            </a>
          </p>
          
          <p style="margin-top: 24px; color: #666; font-size: 12px;">
            You can also review this application at: ${reviewUrl}
          </p>
        `,
        text: `
New Reviewer Application

Applicant: ${data.applicantName}
Email: ${data.applicantEmail}
Role: ${data.clinicalRole}
Specialty: ${data.specialty}
${data.institution ? `Institution: ${data.institution}` : ''}
${data.yearsPractice ? `Years Experience: ${data.yearsPractice}` : ''}

Justification:
${data.justification}

Review this application at: ${reviewUrl}
        `,
      });

      console.log(`Email notification sent to ${ADMIN_EMAIL} for application ${data.applicationId}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw - email failure shouldn't prevent application submission
    }
  } else {
    // Log to console in development
    console.log('\n========================================');
    console.log('NEW REVIEWER APPLICATION');
    console.log('========================================');
    console.log(`Applicant: ${data.applicantName} (${data.applicantEmail})`);
    console.log(`Role: ${data.clinicalRole}`);
    console.log(`Specialty: ${data.specialty}`);
    if (data.institution) console.log(`Institution: ${data.institution}`);
    if (data.yearsPractice) console.log(`Years Experience: ${data.yearsPractice}`);
    console.log(`Justification: ${data.justification}`);
    console.log(`Review URL: ${reviewUrl}`);
    console.log('========================================\n');
  }
}
