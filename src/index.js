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

<b>${amount} ${from}</b> → <b>${formattedResult} ${to}</b>

Курс:
1 ${from} = ${formattedRate} ${to}
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
        message += `${currency}: ${rate.toFixed(4)}\n`;
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
          message += `• <b>${currency}</b>: ${rate.toFixed(4)} USD\n`;
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
        `✓ <b>${currency}</b> добавлен в отслеживание.`
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
      `ℹ️ <b>${currency}</b> не найдена в списке.`
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
    `✓ <b>${currency}</b> удалена из отслеживания.`
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
const greeting = 
  `<b> Greetings! </b>
  
  <b> C2C Bot - is your main helper in instant currency conversions </b>
- Helps you track changes on the currency market
- Reliable currency calculator
- A useful tool in life and for business`;
  

export default{
  async fetch(request, env){
    if(request.method !== "POST"){
    return new Response("Cb s alive");
  }
    const update = await request.json();
    console.log(update);
    

    const chatId = update.message?.chat?.id;
    const text = update.message?.text;
    if(!chatId || !text){
      return new Response("OK");
    }
    if(text === "/start"){
      await sendMessage(env.BOT_TOKEN, chatId, greeting);
    }
    else if (text.startsWith("/convert")) {
  await handleConvert(chatId, text, env);
    }
    else if (text.startsWith("/table")){
  await handleTable(chatId,env);
   }
    else if (text.startsWith("/track")) {

  await handleTrack(
    chatId,
    text,
    env
  );
    }
  else if (text.startsWith("/untrack")) {
  await handleUntrack(
    chatId,
    text,
    env
  );
}

else if (text === "/unsubscribe") {
  await handleUnsubscribe(
    chatId,
    env
  );
}
    return new Response ("OK");
  }
};
