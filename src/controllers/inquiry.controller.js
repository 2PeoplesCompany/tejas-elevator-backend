import { supabase } from "../config/supabase.js";
import { sendInquiryNotification } from "../services/email.service.js";

// In-memory store fallback when Supabase is not configured yet
const localInquiries = [];

export const createInquiry = async (req, res) => {
  try {
    const { fullName, phone, email, liftType, floors, buildingType, message } = req.body;

    // Input Validation
    if (!fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: "Full Name, Phone number, and Email are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    const cleanPhone = phone.trim().replace(/[^0-9+()-\s]/g, "");
    if (cleanPhone.length < 7 || cleanPhone.length > 25) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid phone number (at least 7 digits).",
      });
    }

    const newInquiry = {
      full_name: fullName.trim().slice(0, 120),
      phone: cleanPhone,
      email: email.trim().toLowerCase().slice(0, 150),
      lift_type: (liftType || "Passenger Elevators").slice(0, 100),
      floors: (floors || "G + 3 Floors").slice(0, 100),
      building_type: (buildingType || "Residential").slice(0, 100),
      message: message ? message.trim().slice(0, 3000) : "",
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

