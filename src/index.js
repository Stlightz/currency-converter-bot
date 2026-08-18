export default{
  async fetch(request, env){
    if(request.method !== "POST"){
    return new Response("Cb s alive");
  }
    const update = await request.json();
    console.log(update);
    return new Response ("OK");
  }
};
