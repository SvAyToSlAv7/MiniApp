// app.js (или server.js, index.js - как назовешь)
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path'); // Для работы с путями к файлам

const app = express();
const port = 3000;

// Укажите ваш токен бота здесь
const BOT_TOKEN = '7269213705:AAGsFeTTBZnsds1s-TCs7r0t9iaJTV0SgtQ'; // !!! ЗАМЕНИТЕ !!!
const botApi = new TelegramBot(BOT_TOKEN);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Маршрут для получения HTML-страницы
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Путь к HTML-файлу
});

// Эндпоинт для создания ссылки на оплату
app.post("/create-invoice", async (req, res) => {
  try {
    const invoiceLink = await botApi.createInvoiceLink(
      "Покупка Telegram Stars", // title
      "Оплата для получения доступа к контенту", // description
      "{}", // payload
      "", // Для Telegram Stars payment этот параметр должен быть пустым
      "XTR", // currency
      [{ amount: 100, label: "100 Stars" }]  // Цены. Сумма указывается в минимальных единицах (копейках для рублей, центах для долларов)
    );

    res.json({ invoiceLink });
  } catch (error) {
    console.error("Ошибка при создании ссылки на оплату:", error);
    res.status(500).json({ error: "Не удалось создать ссылку на оплату" });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
