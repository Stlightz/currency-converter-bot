async function sendMessage(token, chatId, text){
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url,{
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
      parse_mode: "HTML" 
    })
  });
  if(!response.ok){
    throw new Error(`Telegram API error: ${response.status}`);
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
    return new Response ("OK");
  }
};
