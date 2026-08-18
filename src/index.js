async function sendMessage(token, chatId, text){
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url,{
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text})
  });
  if(!response.ok){
    throw new ERROR(`Telegram API error: ${response.status}`);
  }
  return response.json();
}



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
      await sendMessage(env.BOT_TOKEN, chatId, "Привет! Я пидорас");
    }
    return new Response ("OK");
  }
};
