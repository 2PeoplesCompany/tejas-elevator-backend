import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "tejaselevatorengineering@gmail.com";
const FROM_EMAIL = process.env.EMAIL_FROM || "Tejas Elevator Notifications <onboarding@resend.dev>";
const DASHBOARD_URL = "https://tejas-elevator-frontend.vercel.app/admin";

/**
 * Sends an email notification to the company admin when a new inquiry is submitted.
 * Failsafe: Never throws unhandled errors to ensure customer API response is not interrupted.
 */
export async function sendInquiryNotification(inquiry) {
  if (!resend) {
    console.log("[Email Service] RESEND_API_KEY not configured. Skipping email notification.");
    return { success: false, skipped: true };
  }

  try {
    const {
      full_name,
      fullName,
      phone,
      email,
      lift_type,
      liftType,
      floors,
      building_type,
      buildingType,
      message,
      id,
    } = inquiry;

    const clientName = full_name || fullName || "Valued Client";
    const clientPhone = phone || "Not Provided";
    const clientEmail = email || "Not Provided";
    const selectedLift = lift_type || liftType || "Not Specified";
    const selectedFloors = floors || "Not Specified";
    const building = building_type || buildingType || "Not Specified";
    const clientMessage = message || "None provided";

    const subject = `🛎️ New Elevator Inquiry: ${clientName} (${selectedLift})`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; border-bottom: 3px solid #0052cc; }
        .badge { display: inline-block; padding: 4px 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; font-weight: bold; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
        .title { margin: 0; font-size: 20px; font-weight: 800; }
        .subtitle { margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; }
        .body { padding: 24px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .data-table td.label { width: 35%; color: #64748b; font-weight: 600; }
        .data-table td.value { width: 65%; color: #0f172a; font-weight: bold; }
        .message-box { background: #f8fafc; border-left: 4px solid #0052cc; padding: 12px 16px; font-size: 13px; color: #334155; font-style: italic; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
        .action-row { display: flex; gap: 12px; margin-top: 20px; }
        .btn-primary { display: inline-block; padding: 12px 20px; background: #0052cc; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; }
        .btn-secondary { display: inline-block; padding: 12px 20px; background: #f1f5f9; color: #0f172a !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">Tejas Elevator Lead Dispatch</div>
          <h1 class="title">New Customer Project Inquiry</h1>
          <p class="subtitle">Received via Public Website Consultation Desk</p>
        </div>
        <div class="body">
          <div class="section-title">Customer Contact Details</div>
          <table class="data-table">
            <tr>
              <td class="label">Full Name:</td>
              <td class="value">${clientName}</td>
            </tr>
            <tr>
              <td class="label">Phone Number:</td>
              <td class="value"><a href="tel:${clientPhone}" style="color:#0052cc; text-decoration:none;">${clientPhone} (Tap to Call)</a></td>
            </tr>
            <tr>
              <td class="label">Email Address:</td>
              <td class="value"><a href="mailto:${clientEmail}" style="color:#0052cc; text-decoration:none;">${clientEmail}</a></td>
            </tr>
          </table>

          <div class="section-title">Elevator Specification</div>
          <table class="data-table">
            <tr>
              <td class="label">Lift Type:</td>
              <td class="value">${selectedLift}</td>
            </tr>
            <tr>
              <td class="label">Total Floors:</td>
              <td class="value">${selectedFloors}</td>
            </tr>
            <tr>
              <td class="label">Building Type:</td>
              <td class="value">${building}</td>
            </tr>
          </table>

          <div class="section-title">Customer Message / Notes</div>
          <div class="message-box">"${clientMessage}"</div>

          <div class="section-title">Immediate Action</div>
          <div style="margin-top: 12px;">
            <a href="${DASHBOARD_URL}" class="btn-primary">Open in Admin Portal</a>
            <a href="tel:${clientPhone}" class="btn-secondary" style="margin-left: 8px;">Call Customer</a>
          </div>
        </div>
        <div class="footer">
          Tejas Elevator Engineering • House No-J-5, Rajabagicha, Cuttack, Odisha – 753009<br>
          Inquiry ID: ${id || "Live Submission"} • Delivered via Resend
        </div>
      </div>
    </body>
    </html>
    `;

    const sendOptions = {
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    };

    if (clientEmail && clientEmail.includes("@")) {
      sendOptions.replyTo = clientEmail;
    }

    const result = await resend.emails.send(sendOptions);

    console.log(`[Email Service] Notification sent successfully for inquiry ${id || clientName}:`, result);
    return { success: true, result };
  } catch (error) {
    console.error("[Email Service Error]: Failed to send inquiry email notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email notification to the company admin when an AMC request is submitted.
 */
export async function sendAMCNotification(amcRequest) {
  if (!resend) {
    console.log("[Email Service] RESEND_API_KEY not configured. Skipping AMC notification.");
    return { success: false, skipped: true };
  }

  try {
    const {
      contact_name,
      contactName,
      phone,
      email,
      property_name,
      propertyName,
      property_address,
      propertyAddress,
      current_lifts_count,
      currentLiftsCount,
      plan_type,
      planType,
      message,
      id,
    } = amcRequest;

    const clientName = contact_name || contactName || "Valued Client";
    const clientPhone = phone || "Not Provided";
    const clientEmail = email || "Not Provided";
    const propName = property_name || propertyName || "Not Specified";
    const propAddress = property_address || propertyAddress || "Not Specified";
    const liftsCount = current_lifts_count || currentLiftsCount || "1";
    const selectedPlan = plan_type || planType || "Comprehensive AMC";
    const notes = message || "None provided";

    const subject = `🔧 New AMC Contract Request: ${propName} (${clientName})`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; color: #ffffff; padding: 24px; border-bottom: 3px solid #10b981; }
        .badge { display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; font-weight: bold; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
        .title { margin: 0; font-size: 20px; font-weight: 800; }
        .subtitle { margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; }
        .body { padding: 24px; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .data-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .data-table td.label { width: 35%; color: #64748b; font-weight: 600; }
        .data-table td.value { width: 65%; color: #0f172a; font-weight: bold; }
        .message-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; font-size: 13px; color: #334155; font-style: italic; margin-bottom: 24px; border-radius: 0 6px 6px 0; }
        .btn-primary { display: inline-block; padding: 12px 20px; background: #10b981; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; }
        .btn-secondary { display: inline-block; padding: 12px 20px; background: #f1f5f9; color: #0f172a !important; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">Annual Maintenance Dispatch</div>
          <h1 class="title">New AMC Site Survey Request</h1>
          <p class="subtitle">Preventive Maintenance & Safety Audit Contract</p>
        </div>
        <div class="body">
          <div class="section-title">Property & Contact Info</div>
          <table class="data-table">
            <tr>
              <td class="label">Property Name:</td>
              <td class="value">${propName}</td>
            </tr>
            <tr>
              <td class="label">Contact Person:</td>
              <td class="value">${clientName}</td>
            </tr>
            <tr>
              <td class="label">Phone:</td>
              <td class="value"><a href="tel:${clientPhone}" style="color:#10b981; text-decoration:none;">${clientPhone} (Tap to Call)</a></td>
            </tr>
            <tr>
              <td class="label">Email:</td>
              <td class="value"><a href="mailto:${clientEmail}" style="color:#10b981; text-decoration:none;">${clientEmail}</a></td>
            </tr>
            <tr>
              <td class="label">Location / Address:</td>
              <td class="value">${propAddress}</td>
            </tr>
          </table>

          <div class="section-title">Service Details</div>
          <table class="data-table">
            <tr>
              <td class="label">Requested Plan:</td>
              <td class="value">${selectedPlan}</td>
            </tr>
            <tr>
              <td class="label">Number of Elevators:</td>
              <td class="value">${liftsCount} Units</td>
            </tr>
          </table>

          <div class="section-title">Notes / Current Lift Status</div>
          <div class="message-box">"${notes}"</div>

          <div class="section-title">Immediate Action</div>
          <div style="margin-top: 12px;">
            <a href="${DASHBOARD_URL}" class="btn-primary">View in Admin Portal</a>
            <a href="tel:${clientPhone}" class="btn-secondary" style="margin-left: 8px;">Call Contact</a>
          </div>
        </div>
        <div class="footer">
          Tejas Elevator Engineering • House No-J-5, Rajabagicha, Cuttack, Odisha – 753009<br>
          AMC ID: ${id || "Live Request"} • Delivered via Resend
        </div>
      </div>
    </body>
    </html>
    `;

    const sendOptions = {
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: subject,
      html: htmlContent,
    };

    if (clientEmail && clientEmail.includes("@")) {
      sendOptions.replyTo = clientEmail;
    }

    const result = await resend.emails.send(sendOptions);

    console.log(`[Email Service] AMC notification sent successfully for ${propName}:`, result);
    return { success: true, result };
  } catch (error) {
    console.error("[Email Service Error]: Failed to send AMC email notification:", error);
    return { success: false, error: error.message };
  }
}
