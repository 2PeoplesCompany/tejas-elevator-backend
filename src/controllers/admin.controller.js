import { supabase } from "../config/supabase.js";

// Helper to check if Supabase is connected
const checkSupabase = (res) => {
  if (!supabase) {
    res.status(503).json({
      success: false,
      error: "Supabase database client is not configured.",
    });
    return false;
  }
  return true;
};

// 1. Check if first-time admin setup is needed (are there any users?)
export const checkAdminSetup = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const needsSetup = !data.users || data.users.length === 0;
    return res.json({
      success: true,
      needsSetup,
      userCount: data.users ? data.users.length : 0,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Setup initial admin user (creates confirmed user in Supabase Auth)
export const setupAdminUser = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Valid email and a password of at least 6 characters are required.",
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        error: "An admin account with this email already exists. Please log in.",
      });
    }

    // Create user with admin privilege and auto-confirmed email
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
        full_name: fullName || "Rajiv Kumar Sethi",
      },
    });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: "Admin account initialized successfully! You can now log in.",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Admin Login using Supabase Auth signInWithPassword
export const adminLogin = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password. Please verify your credentials.",
      });
    }

    return res.json({
      success: true,
      message: "Welcome to Tejas Elevator Admin Dashboard",
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || "Admin",
          role: data.user.user_metadata?.role || "admin",
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 4. Get Admin Overview & KPI Metrics
export const getAdminStats = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const [inquiriesRes, amcRes] = await Promise.all([
      supabase.from("inquiries").select("id, status, created_at, lift_type"),
      supabase.from("amc_requests").select("id, status, created_at, plan_type"),
    ]);

    const inquiries = inquiriesRes.data || [];
    const amc = amcRes.data || [];

    const stats = {
      totalInquiries: inquiries.length,
      newInquiries: inquiries.filter((i) => !i.status || i.status === "new").length,
      contactedInquiries: inquiries.filter((i) => i.status === "contacted").length,
      surveyScheduledInquiries: inquiries.filter((i) => i.status === "survey_scheduled").length,
      quoteSentInquiries: inquiries.filter((i) => i.status === "quote_sent").length,
      closedInquiries: inquiries.filter((i) => i.status === "closed" || i.status === "finalized").length,
      totalAMC: amc.length,
      pendingAMC: amc.filter((a) => !a.status || a.status === "pending").length,
      activeAMC: amc.filter((a) => a.status === "active").length,
    };

    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Get Inquiries with Search & Filter
export const getAllInquiries = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { status, search } = req.query;

    let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    let results = data || [];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.full_name?.toLowerCase().includes(q) ||
          item.phone?.toLowerCase().includes(q) ||
          item.email?.toLowerCase().includes(q) ||
          item.lift_type?.toLowerCase().includes(q) ||
          item.building_type?.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: results.length, inquiries: results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Update Inquiry Status & Assigned Officer
export const updateInquiry = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    console.log(`[Admin Controller] updateInquiry called for ID: "${id}" with body:`, req.body);

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;

    console.log("[Admin Controller] updates payload:", updates);

    const { data, error } = await supabase
      .from("inquiries")
      .update(updates)
      .eq("id", id.trim())
      .select();

    console.log("[Admin Controller] Supabase update result - data:", data, "error:", error);

    if (error) {
      console.error("[Admin Controller Error]:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!data || data.length === 0) {
      console.warn(`[Admin Controller Warning]: No row was updated for ID: ${id}`);
    }

    return res.json({
      success: true,
      message: "Inquiry updated successfully.",
      inquiry: data ? data[0] : null,
    });
  } catch (err) {
    console.error("[Admin Controller Exception]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Delete Inquiry
export const deleteInquiry = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { id } = req.params;
    const { error } = await supabase.from("inquiries").delete().eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Inquiry record deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Get AMC Requests with Search & Filter
export const getAllAMCRequests = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { status, search } = req.query;

    let query = supabase.from("amc_requests").select("*").order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    let results = data || [];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.contact_name?.toLowerCase().includes(q) ||
          item.property_name?.toLowerCase().includes(q) ||
          item.phone?.toLowerCase().includes(q) ||
          item.plan_type?.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: results.length, amcRequests: results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 9. Update AMC Request Status
export const updateAMCRequest = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`[Admin Controller] updateAMCRequest called for ID: "${id}" with status: "${status}"`);

    const { data, error } = await supabase
      .from("amc_requests")
      .update({ status })
      .eq("id", id.trim())
      .select();

    console.log("[Admin Controller] Supabase update AMC result - data:", data, "error:", error);

    if (error) {
      console.error("[Admin Controller AMC Error]:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: "AMC request status updated successfully.",
      amcRequest: data ? data[0] : null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 10. Delete AMC Request
export const deleteAMCRequest = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { id } = req.params;
    const { error } = await supabase.from("amc_requests").delete().eq("id", id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "AMC request deleted." });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 11. Change Admin Password
export const changeAdminPassword = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.adminUser;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long.",
      });
    }

    // Verify current password first by attempting sign in
    if (currentPassword) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect. Please re-enter your current password.",
        });
      }
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
      });
    }

    return res.json({
      success: true,
      message: "Admin password updated successfully! Please use your new password next time you sign in.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 12. Update Admin Profile (Full Name / Email)
export const updateAdminProfile = async (req, res) => {
  if (!checkSupabase(res)) return;

  try {
    const { email, fullName } = req.body;
    const user = req.adminUser;

    const updates = {};
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      updates.email = email.trim().toLowerCase();
    }
    if (fullName && fullName.trim()) {
      updates.user_metadata = {
        ...(user.user_metadata || {}),
        full_name: fullName.trim(),
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No profile changes provided.",
      });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, updates);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: "Admin profile updated successfully.",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || fullName,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
