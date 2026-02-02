import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

// Email configuration - can be updated in the future
const ADMIN_EMAIL = 'thomasmee777@gmail.com';

// Create a transporter for sending emails
function createTransporter() {
  // For development/testing, use ethereal or console logging
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVER_HOST) {
    return null; // Will log to console instead
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

async function sendApplicationNotification(application: {
  userName: string;
  userEmail: string;
  clinicalRole: string;
  specialty: string;
  yearsPractice: number | null;
  institution: string | null;
  qualifications: string;
  justification: string | null;
}) {
  const transporter = createTransporter();
  
  const emailContent = `
New Reviewer Application Received

Applicant: ${application.userName || 'Unknown'}
Email: ${application.userEmail}
Clinical Role: ${application.clinicalRole}
Specialty: ${application.specialty}
Years of Practice: ${application.yearsPractice || 'Not specified'}
Institution: ${application.institution || 'Not specified'}

Qualifications:
${application.qualifications}
${application.justification ? `
Motivation:
${application.justification}` : ''}

---
Review this application at: ${process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'}/admin/reviewer-applications
  `.trim();

  if (!transporter) {
    // Development mode - log to console
    console.log('=== REVIEWER APPLICATION EMAIL (DEV MODE) ===');
    console.log(`To: ${ADMIN_EMAIL}`);
    console.log(`Subject: New Reviewer Application - ${application.userEmail}`);
    console.log(emailContent);
    console.log('==============================================');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@bayes-bedside.com',
      to: ADMIN_EMAIL,
      subject: `New Reviewer Application - ${application.userEmail}`,
      text: emailContent,
    });
  } catch (error) {
    console.error('Failed to send application notification email:', error);
    // Don't throw - the application should still be saved even if email fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to submit an application' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    const userName = session.user.name;

    // Check if user already has an application or is already a reviewer
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { reviewerApplication: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingUser.reviewerStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'You are already an approved reviewer' },
        { status: 400 }
      );
    }

    if (existingUser.reviewerStatus === 'APPLIED') {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { clinicalRole, specialty, yearsPractice, institution, licenseOrNPI, qualifications, justification } = body;

    // Validate required fields
    if (!clinicalRole || !specialty || !qualifications) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicalRole, specialty, and qualifications are required' },
        { status: 400 }
      );
    }

    // Create application and update user status in a transaction
    const application = await prisma.$transaction(async (tx) => {
      // Create the application
      const newApplication = await tx.reviewerApplication.create({
        data: {
          userId,
          clinicalRole,
          specialty,
          yearsPractice: yearsPractice ? parseInt(yearsPractice) : null,
          institution: institution || null,
          licenseOrNPI: licenseOrNPI || null,
          qualifications,
          justification: justification || null,
          status: 'PENDING',
        },
      });

      // Update user's reviewer status
      await tx.user.update({
        where: { id: userId },
        data: { reviewerStatus: 'APPLIED' },
      });

      return newApplication;
    });

    // Send email notification (async, don't wait)
    sendApplicationNotification({
      userName: userName || 'Unknown',
      userEmail: userEmail || 'Unknown',
      clinicalRole,
      specialty,
      yearsPractice: yearsPractice ? parseInt(yearsPractice) : null,
      institution,
      qualifications,
      justification,
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application.id,
    });
  } catch (error) {
    console.error('Error submitting reviewer application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check application status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      );
    }

    const application = await prisma.reviewerApplication.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      hasApplication: !!application,
      application: application ? {
        status: application.status,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
      } : null,
      reviewerStatus: session.user.reviewerStatus,
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application status' },
      { status: 500 }
    );
  }
}
