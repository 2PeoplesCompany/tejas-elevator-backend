import { supabase } from "../config/supabase.js";

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

    const newRequest = {
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : "",
      property_name: propertyName.trim(),
      property_address: propertyAddress ? propertyAddress.trim() : "",
      current_lifts_count: parseInt(currentLiftsCount, 10) || 1,
      plan_type: planType || "Comprehensive AMC",
      message: message ? message.trim() : "",
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
