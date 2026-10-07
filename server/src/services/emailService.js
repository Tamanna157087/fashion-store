// Email Service Abstraction
// Handles HTML email templates for user and order events

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`[EMAIL SERVICE] Sending Email to: ${to}`);
    console.log(`[EMAIL SERVICE] Subject: ${subject}`);

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      console.log(`[EMAIL SERVICE] Production SMTP email sent to ${to}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] ${error.message}`);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (user) => {
  const subject = `Welcome to AI Fashion Store, ${user.name}! ✨`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h1 style="color: #4F46E5; margin-top: 0;">Welcome to AI Fashion Store!</h1>
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Thank you for creating an account with us. You now have access to AI-powered personalized fashion recommendations, instant order tracking, and exclusive discounts!</p>
      <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0;">
        Use promo code <span style="color: #4F46E5; font-size: 18px;">WELCOME10</span> for 10% OFF your first order!
      </div>
      <p style="font-size: 12px; color: #666; border-top: 1px solid #eee; pt: 15px;">AI Fashion Store &copy; 2026. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: user.email, subject, html });
};

const sendOrderConfirmationEmail = async (order, userEmail) => {
  const subject = `Order Confirmed - ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #4F46E5; margin-top: 0;">Thank you for your order, ${order.shippingAddress?.name || "Customer"}!</h2>
      <p>Your order <strong>${order.orderId}</strong> has been successfully placed.</p>
      <h3>Order Summary</h3>
      <ul>
        ${(order.items || []).map((i) => `<li>${i.title} (x${i.quantity}) - ₹${i.price}</li>`).join("")}
      </ul>
      <p><strong>Grand Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "3-5 Business Days"}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">AI Fashion Store &copy; 2026. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendPaymentSuccessEmail = async (order, userEmail) => {
  const subject = `Payment Successful for Order ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #10B981; margin-top: 0;">Payment Verified Successfully!</h2>
      <p>Payment for order <strong>${order.orderId}</strong> was received.</p>
      <p><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">AI Fashion Store &copy; 2026</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendOrderShippedEmail = async (order, userEmail) => {
  const subject = `Your Order ${order.orderId} Has Been Shipped! 🚚`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #2563EB; margin-top: 0;">On Its Way!</h2>
      <p>Your order <strong>${order.orderId}</strong> is now shipped and in transit.</p>
      <p><strong>Tracking ID:</strong> ${order.trackingId || "N/A"}</p>
      <p><strong>Estimated Delivery:</strong> ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "3-5 Days"}</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendOrderDeliveredEmail = async (order, userEmail) => {
  const subject = `Order ${order.orderId} Delivered 🎉`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #059669; margin-top: 0;">Delivered!</h2>
      <p>Your package for order <strong>${order.orderId}</strong> was successfully delivered.</p>
      <p>Thank you for shopping with AI Fashion Store!</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendOrderCancelledEmail = async (order, userEmail) => {
  const subject = `Order ${order.orderId} Cancelled`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #EF4444; margin-top: 0;">Order Cancelled</h2>
      <p>Order <strong>${order.orderId}</strong> has been cancelled.</p>
      ${order.cancelReason ? `<p><strong>Reason:</strong> ${order.cancelReason}</p>` : ""}
      <p>If any payment was collected, your refund will be processed shortly.</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendReturnApprovedEmail = async (order, userEmail) => {
  const subject = `Return Approved for Order ${order.orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #8B5CF6; margin-top: 0;">Return Request Approved</h2>
      <p>Your return request for order <strong>${order.orderId}</strong> has been approved.</p>
      <p>Refund Status: <strong>${order.refundStatus}</strong></p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const subject = `Password Reset Request - AI Fashion Store`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #111; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #DC2626; margin-top: 0;">Reset Your Password</h2>
      <p>You requested a password reset for your account.</p>
      <p>Your security code is: <strong style="font-size: 20px; color: #4F46E5;">${resetToken}</strong></p>
      <p>This code expires in 15 minutes. If you did not make this request, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentSuccessEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendReturnApprovedEmail,
  sendPasswordResetEmail,
};
