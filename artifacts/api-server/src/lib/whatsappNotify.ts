/**
 * Sends a WhatsApp message via CallMeBot.
 * Fires-and-forgets — a failure never blocks the main request.
 */
export async function notifyWhatsApp(message: string): Promise<void> {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_API_KEY;

  if (!phone || !apiKey) {
    // Not configured — skip silently
    return;
  }

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[whatsappNotify] CallMeBot responded with ${res.status}`);
    }
  } catch (err) {
    console.warn("[whatsappNotify] Failed to send notification:", err);
  }
}
