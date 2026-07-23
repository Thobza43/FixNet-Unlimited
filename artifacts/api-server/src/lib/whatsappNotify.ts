/**
 * Sends an order notification via Telegram bot.
 * Fires-and-forgets — a failure never blocks the main request.
 */
export async function notifyWhatsApp(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      console.warn(`[notify] Telegram responded with ${res.status}`);
    }
  } catch (err) {
    console.warn("[notify] Failed to send Telegram notification:", err);
  }
}
