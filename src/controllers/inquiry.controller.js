import { supabase } from "../config/supabase.js";
import { sendInquiryNotification } from "../services/email.service.js";

// In-memory store fallback when Supabase is not configured yet
const localInquiries = [];

export const createInquiry = async (req, res) => {
  try {
    const { fullName, phone, email, liftType, floors, buildingType, message } = req.body;

    // Validation
    if (!fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "Full Name, Phone number, and Email are required.",
      });
    }

    const newInquiry = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      lift_type: liftType || "Passenger Elevators",
      floors: floors || "G + 3 Floors",
      building_type: buildingType || "Residential",
      message: message ? message.trim() : "",
      status: "new",
      assigned_to: "Rajiv Kumar Sethi",
      created_at: new Date().toISOString(),
    };

    let savedData = null;

    if (supabase) {
      const { data, error } = await supabase
        .from("inquiries")
        .insert([newInquiry])
        .select();

      if (error) {
        console.error("[Supabase Error] Failed to insert inquiry:", error);
        // Fallback to local array
        localInquiries.push({ ...newInquiry, id: `local-${Date.now()}` });
        savedData = newInquiry;
      } else {
        savedData = data[0];
        console.log(`[Supabase] Inquiry inserted successfully with ID: ${savedData.id}`);
      }
    } else {
      newInquiry.id = `local-${Date.now()}`;
      localInquiries.push(newInquiry);
      savedData = newInquiry;
    }

    // Console Alert Log for Company Notification
    console.log("==================================================");
    console.log("🛎️ NEW ELEVATOR PROJECT INQUIRY RECEIVED");
    console.log(`Client: ${fullName} | Phone: ${phone} | Email: ${email}`);
    console.log(`Product: ${liftType} | Floors: ${floors} | Building: ${buildingType || "N/A"}`);
    console.log(`Message: ${message || "N/A"}`);
    console.log(`Notified Desk: Engineering Consultation Desk (tejaselevatorengineering@gmail.com)`);
    console.log("==================================================");

    // Trigger real-time email notification asynchronously (non-blocking)
    sendInquiryNotification(savedData).catch((err) => {
      console.error("[Email Notification Trigger Error]:", err);
    });

    return res.status(201).json({
      success: true,
      message: `Thank you, ${fullName}! Your elevator specification inquiry has been registered. Our engineering desk will contact you at ${phone} within 24 hours.`,
      inquiry: savedData,
    });
  } catch (error) {
    console.error("[Inquiry Controller Error]:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while recording elevator inquiry.",
    });
  }
};

