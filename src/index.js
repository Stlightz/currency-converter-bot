const currencyFlags = {
  RUB:{
    emoji: "🇷🇺",
    id: "5913274246867456342"
  },
  USD:{
    emoji: "🇺🇸",
    id: "5913463998522592692"
  },
  EUR:{
    emoji: "🇪🇺",
    id: "5911106310585193018"
  },
  GBP:{
    emoji: "🇬🇧",
    id: "5913443365499703513"
  }
}
async function getRates(base, env) {
  const url =
    `https://v6.exchangerate-api.com/v6/${env.EXCHANGE_API_KEY}/latest/${base}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ExchangeRate API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.result !== "success") {
    throw new Error(`ExchangeRate API error: ${data["error-type"]}`);
  }

  return data;
}
function getCurrencyEmoji(currency) {

  const flags = {
    // Северная Америка
    USD: "🇺🇸", // США
    CAD: "🇨🇦", // Канада
    MXN: "🇲🇽", // Мексика

    // Европа
    EUR: "🇪🇺", // Евро
    GBP: "🇬🇧", // Великобритания
    CHF: "🇨🇭", // Швейцария
    RUB: "🇷🇺", // Россия
    PLN: "🇵🇱", // Польша
    SEK: "🇸🇪", // Швеция
    NOK: "🇳🇴", // Норвегия
    DKK: "🇩🇰", // Дания
    CZK: "🇨🇿", // Чехия
    HUF: "🇭🇺", // Венгрия
    RON: "🇷🇴", // Румыния
    TRY: "🇹🇷", // Турция
    UAH: "🇺🇦", // Украина

    // Азия
    JPY: "🇯🇵", // Япония
    CNY: "🇨🇳", // Китай
    HKD: "🇭🇰", // Гонконг
    SGD: "🇸🇬", // Сингапур
    KRW: "🇰🇷", // Южная Корея
    INR: "🇮🇳", // Индия
    IDR: "🇮🇩", // Индонезия
    MYR: "🇲🇾", // Малайзия
    THB: "🇹🇭", // Таиланд
    VND: "🇻🇳", // Вьетнам
    PHP: "🇵🇭", // Филиппины
    AED: "🇦🇪", // ОАЭ
    SAR: "🇸🇦", // Саудовская Аравия
    ILS: "🇮🇱", // Израиль

    // Океания
    AUD: "🇦🇺", // Австралия
    NZD: "🇳🇿", // Новая Зеландия

    // Южная Америка
    BRL: "🇧🇷", // Бразилия
    ARS: "🇦🇷", // Аргентина
    CLP: "🇨🇱", // Чили
    COP: "🇨🇴", // Колумбия

    // Африка
    ZAR: "🇿🇦", // ЮАР
    EGP: "🇪🇬", // Египет
    NGN: "🇳🇬", // Нигерия
    KES: "🇰🇪", // Кения
    MAD: "🇲🇦", // Марокко

    // Крипто (если потом добавишь)
    BTC: "₿",
    ETH: "Ξ"
  };

  return flags[currency] || "💱";
}
async function handleConvert(chatId, text, env) {
  const parts = text.trim().split(/\s+/);

  if (parts.length !== 4) {
    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      `<b>Использование:</b>\n<code>/convert 100 USD EUR</code>`
    );
    return;
  }

  const amount = Number(parts[1]);
  const from = parts[2].toUpperCase();
  const to = parts[3].toUpperCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      "❌ Некорректная сумма."
    );
    return;
  }

  try {
    const data = await getRates(from, env);

    const rate = data.conversion_rates[to];

    if (rate === undefined) {
      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        `❌ Валюта <b>${to}</b> не найдена.`
      );
      return;
    }

    const result = amount * rate;

    const formattedResult = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2
    }).format(result);

    const formattedRate = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 6
    }).format(rate);

    const message = `
<b>💱 Конвертация</b>

${getCurrencyEmoji(from)} <b>${amount} ${from}</b>
 →
${getCurrencyEmoji(to)} <b>${formattedResult} ${to}</b>

Курс:
${getCurrencyEmoji(from)} 1 ${from} =
${formattedRate} ${to}
`;

    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      message
    );

  } catch (error) {
    console.error(error);

    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      "❌ Не удалось получить курс валют."
    );
  }
}
async function getUsers(env) {
  const users = await env.CURRENCY_KV.get(
    "users",
    "json"
  );

  return users || [];
}
async function registerUser(chatId, env) {
  const users = await getUsers(env);

  if (!users.includes(chatId)) {
    users.push(chatId);

    await env.CURRENCY_KV.put(
      "users",
      JSON.stringify(users)
    );
  }
}

async function handleTable(chatId, env) {
  const currencies = [
    "EUR",
    "GBP",
    "JPY",
    "CHF",
    "CAD",
    "AUD",
    "CNY",
    "PLN",
    "RUB",
    "TRY"
  ];

  try {
    const data = await getRates("USD", env);

    let message = `<b>💱 Основные курсы</b>\n\n`;
    message += `<b>База: USD</b>\n\n`;

    for (const currency of currencies) {
      const rate = data.conversion_rates[currency];

      if (rate !== undefined) {
        message += `${getCurrencyEmoji(currency)} ${currency}: ${rate.toFixed(4)}\n`;
      }
    }

    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      message
    );

  } catch (error) {
    console.error(error);

    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      "❌ Не удалось получить курсы валют."
    );
  }
}

async function getTracked(chatId, env) {
  const tracked = await env.CURRENCY_KV.get(
    String(chatId),
    "json"
  );

  return tracked || [];
}
async function handleTrack(chatId, text, env) {
  const parts = text.trim().split(/\s+/);


  if (parts.length === 1) {
    try {
      const tracked = await getTracked(chatId, env);

      if (tracked.length === 0) {
        await sendMessage(
          env.BOT_TOKEN,
          chatId,
          `📊 <b>Отслеживаемые валюты</b>\n\nСписок пуст.\n\nДобавить: <code>/track USD</code>`
        );
        return;
      }

      const data = await getRates("USD", env);

      let message = `📊 <b>Отслеживаемые валюты</b>\n\n`;

      for (const currency of tracked) {
        const rate = data.conversion_rates[currency];

        if (rate !== undefined) {
          message += `• ${getCurrencyEmoji(currency)} <b>${currency}</b>: ${rate.toFixed(4)} USD\n`;
        }
      }

      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        message
      );

    } catch (error) {
      console.error("TRACK LIST ERROR:", error);

      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        "❌ Не удалось получить список валют."
      );
    }

    return;
  }



  if (parts.length === 2) {
    const currency = parts[1].toUpperCase();

    try {
      const data = await getRates("USD", env);

      if (!(currency in data.conversion_rates)) {
        await sendMessage(
          env.BOT_TOKEN,
          chatId,
          `❌ Валюта <b>${currency}</b> не найдена.`
        );
        return;
      }

      const tracked = await getTracked(chatId, env);

      if (tracked.includes(currency)) {
        await sendMessage(
          env.BOT_TOKEN,
          chatId,
          `ℹ️ <b>${currency}</b> уже отслеживается.`
        );
        return;
      }

      tracked.push(currency);

      await env.CURRENCY_KV.put(
        String(chatId),
        JSON.stringify(tracked)
      );

      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        `✓ ${getCurrencyEmoji(currency)} <b>${currency}</b> добавлен в отслеживание.`
      );

    } catch (error) {
      console.error("TRACK ADD ERROR:", error);

      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        "❌ Не удалось добавить валюту."
      );
    }

    return;
  }
}
async function handleUntrack(chatId, text, env) {
  const parts = text.trim().split(/\s+/);

  if (parts.length !== 2) {
    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      `<b>Использование:</b>\n<code>/untrack USD</code>`
    );
    return;
  }

  const currency = parts[1].toUpperCase();

  const tracked = await getTracked(chatId, env);

  if (!tracked.includes(currency)) {
    await sendMessage(
      env.BOT_TOKEN,
      chatId,
      `ℹ️ ${getCurrencyEmoji(currency)} <b>${currency}</b> не найдена в списке.`
    );
    return;
  }

  const updated = tracked.filter(
    item => item !== currency
  );

  await env.CURRENCY_KV.put(
    String(chatId),
    JSON.stringify(updated)
  );

  await sendMessage(
    env.BOT_TOKEN,
    chatId,
    `✓ ${getCurrencyEmoji(currency)} <b>${currency}</b> удалена из отслеживания.`
  );
}
async function handleUnsubscribe(chatId, env) {

  await env.CURRENCY_KV.delete(
    String(chatId)
  );

  await sendMessage(
    env.BOT_TOKEN,
    chatId,
    "✓ Все отслеживаемые валюты удалены."
  );
}
async function getLastRates(chatId, env) {
  const rates = await env.CURRENCY_KV.get(
    `rates:${chatId}`,
    "json"
  );

  return rates || {};
}


async function saveLastRates(chatId, rates, env) {
  await env.CURRENCY_KV.put(
    `rates:${chatId}`,
    JSON.stringify(rates)
  );
}
async function sendMessage(token, chatId, text) {
  const url =
    `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    })
  });

  if (!response.ok) {
    throw new Error(
      `Telegram API error: ${response.status}`
    );
  }

  return response.json();
}
async function sendCurrencyUpdate(chatId, env) {

  const tracked = await getTracked(chatId, env);

  if (tracked.length === 0) {
    return;
  }


  const data = await getRates("USD", env);

  const oldRates = await getLastRates(
    chatId,
    env
  );


  let message = `<b>📊 Изменение курсов</b>\n\n`;

  const newRates = {};


  for (const currency of tracked) {

    const current =
      data.conversion_rates[currency];


    if (!current) {
      continue;
    }


    newRates[currency] = current;


    if (!oldRates[currency]) {

      message +=
        `${getCurrencyEmoji(currency)} ${currency}: ${current.toFixed(4)}\n`;

      continue;
    }


    const change =
      ((current - oldRates[currency])
      / oldRates[currency]) * 100;


    let icon = "➡️";

    if (change > 0) {
      icon = "📈";
    }

    if (change < 0) {
      icon = "📉";
    }


    message +=
      `${getCurrencyEmoji(currency)} <b>${currency}</b>: ${current.toFixed(4)} ${icon} ${change.toFixed(2)}%\n`;
  }


  await saveLastRates(
    chatId,
    newRates,
    env
  );


  await sendMessage(
    env.BOT_TOKEN,
    chatId,
    message
  );
}
const greeting = 
`<b> Greetings! </b>

<b> C2C Bot - is your main helper in instant currency conversions </b>

- Helps you track changes on the currency market
- Reliable currency calculator
- A useful tool in life and for business

<code>
Основные команды:

/convert - ручная конвертация
/table - обзор мировых валют
/track &lt;currency&gt; - начать отслеживать курс валюты
/untrack &lt;currency&gt; - прекратить отслеживать курс валюты
/unsubscribe - полностью отписаться от рассылок 
/track - отслеживаемые валюты
</code>`;
  

export default {
  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Cb s alive");
    }

    const update = await request.json();
    console.log(update);

    const chatId = update.message?.chat?.id;
    const text = update.message?.text;

    if (!chatId || !text) {
      return new Response("OK");
    }

    await registerUser(chatId, env);

    if (text === "/start") {
      await sendMessage(
        env.BOT_TOKEN,
        chatId,
        greeting
      );

    } else if (text.startsWith("/convert")) {
      await handleConvert(
        chatId,
        text,
        env
      );

    } else if (text === "/table") {
      await handleTable(
        chatId,
        env
      );

    } else if (text.startsWith("/track")) {
      await handleTrack(
        chatId,
        text,
        env
      );

    } else if (text.startsWith("/untrack")) {
      await handleUntrack(
        chatId,
        text,
        env
      );

    } else if (text === "/unsubscribe") {
      await handleUnsubscribe(
        chatId,
        env
      );
    }

    return new Response("OK");
  },


  async scheduled(event, env, ctx) {

    const users = await getUsers(env);

    for (const chatId of users) {
      try {
        await sendCurrencyUpdate(
          chatId,
          env
        );

      } catch(error) {
        console.error(
          "SEND ERROR:",
          chatId,
          error
        );
      }
    }

  }
};
