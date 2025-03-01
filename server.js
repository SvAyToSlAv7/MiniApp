const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");
const app = express();
const port = 3000;
require("dotenv").config();

const TELEGRAM_BOT_TOKEN = "7269213705:AAGsFeTTBZnsds1s-TCs7r0t9iaJTV0SgtQ";
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
//Map to track payments
const paidUsers = new Map();

app.use(express.json());
app.use(cors());

// Handle pre-checkout queries
bot.on("pre_checkout_query", (query) => {
  bot.answerPreCheckoutQuery(query.id, true).catch(() => {
    console.error("answerPreCheckoutQuery failed");
  });
});

// Handle successful payments
bot.on("message", (msg) => {
  if (msg.successful_payment) {
    const userId = msg.from.id;
    paidUsers.set(userId, msg.successful_payment.telegram_payment_charge_id);
  }
});

// Handle the /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const message = paidUsers.has(userId)
    ? "You have paid"
    : "You have not paid yet";
  bot.sendMessage(chatId, message);
});

// telegram stars /refund command
bot.onText(/\/refund/, async (msg) => {
  const userId = msg.from.id;

  if (!paidUsers.has(userId)) {
    return bot.sendMessage(
      msg.chat.id,
      "You have not paid yet, there is nothing to refund."
    );
  }

  const chargeId = paidUsers.get(userId);

  try {
    const form = {
      user_id: userId,
      telegram_payment_charge_id: chargeId,
    };

    const refundResponse = await bot._request("refundStarPayment", { form });

    if (refundResponse) {
      paidUsers.delete(userId);
      bot.sendMessage(msg.chat.id, "Your payment has been refunded.");
    } else {
      bot.sendMessage(msg.chat.id, "Refund failed. Please try again later.");
    }
  } catch (error) {
    console.error("Refund failed:", error);
    bot.sendMessage(msg.chat.id, "Refund failed. Please try again later.");
  }
});

bot.startPolling();

const productName = "Test Product";
const description = "Test description";
const payload = "unique_payload";
const providerToken = process.env.TELEGRAM_TOKEN;
const currency = "XTR";
const prices = [{ amount: 100, label: productName }];

app.post("/api/createInvoiceLink", async (req, res) => {
  const { payload, currency, prices } = req.body;

  // Check for required fields
  if (!payload || !currency || !prices || !(prices[0] && prices[0].amount)) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required parameters." });
  }

  const price = prices[0].amount;

  // Validate that the price is a valid number
  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ success: false, error: "Invalid price." });
  }

  // Dynamically sets title, description, and label based on the price
  const title = `item for ${price}`;
  const description = `Buying an item for ${price} stars.`;
  const label = `Restoring for ${price} ${currency}`;

  try {
    // Create the invoice link using the Telegram Bot API
    const invoiceLink = await bot.createInvoiceLink(
      title,
      description,
      payload,
      providerToken,
      currency,
      [{ label, amount: price }]
    );

    res.json({ success: true, invoiceLink });
  } catch (error) {
    console.error("Error creating invoice link:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
