import { supabase } from "../config/supabase.js";
import { sendAMCNotification } from "../services/email.service.js";

const localAMC = [];

export const createAMCRequest = async (req, res) => {
  try {
    const { contactName, phone, email, propertyName, propertyAddress, currentLiftsCount, planType, message } = req.body;

    if (!contactName || !phone || !propertyName) {
      return res.status(400).json({
        success: false,
        error: "Contact Name, Phone, and Property Name are required.",
      });
    }

    const cleanPhone = phone.trim().replace(/[^0-9+()-\s]/g, "");
    if (cleanPhone.length < 7 || cleanPhone.length > 25) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid phone number (at least 7 digits).",
      });
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid email address.",
        });
      }
    }

    const parsedLifts = parseInt(currentLiftsCount, 10);
    const safeLiftsCount = isNaN(parsedLifts) || parsedLifts < 1 ? 1 : Math.min(parsedLifts, 100);

    const newRequest = {
      contact_name: contactName.trim().slice(0, 120),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase().slice(0, 150) : "",
      property_name: propertyName.trim().slice(0, 150),
      property_address: propertyAddress ? propertyAddress.trim().slice(0, 300) : "",
      current_lifts_count: safeLiftsCount,
      plan_type: (planType || "Comprehensive AMC").slice(0, 100),
      message: message ? message.trim().slice(0, 3000) : "",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    let savedData = null;

    if (supabase) {
      const { data, error } = await supabase
        .from("amc_requests")
        .insert([newRequest])
        .select();

      if (error) {
        console.error("[Supabase Error] AMC insert:", error);
        newRequest.id = `local-${Date.now()}`;
        localAMC.push(newRequest);
        savedData = newRequest;
      } else {
        savedData = data[0];
      }
    } else {
      newRequest.id = `local-${Date.now()}`;
      localAMC.push(newRequest);
      savedData = newRequest;
    }

    console.log("--------------------------------------------------");
    console.log("🛠️ AMC SERVICE / AUDIT REQUEST REGISTERED");
    console.log(`Property: ${propertyName} | Contact: ${contactName} (${phone})`);
    console.log(`Plan: ${planType} | Lifts: ${currentLiftsCount}`);
    console.log("--------------------------------------------------");

    // Trigger real-time AMC email notification asynchronously
    sendAMCNotification(savedData).catch((err) => {
      console.error("[Email Notification Trigger Error (AMC)]:", err);
    });

    return res.status(201).json({
      success: true,
      message: "Your AMC service audit request has been registered. Our maintenance supervisor will call you to schedule a site audit.",
      data: savedData,
    });
  } catch (error) {
    console.error("[AMC Controller Error]:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit AMC request.",
    });
  }
};
