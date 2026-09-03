async function fetchShare() {
  const shareId = 'kb3nGO8zEmDt';
  
  // Try direct fetch or batchexecute
  // RPC for shared conversation in Gemini is often:
  // f.req = [[["Wjhvtf", JSON.stringify([shareId]), null, "generic"]]] or [["c7KBie", JSON.stringify([shareId]), null, "generic"]]
  
  const rpcs = ["Wjhvtf", "c7KBie", "fP2Aje", "H2s5Eb", "G6Wwfe", "b4pE7b"];
  
  for (const rpc of rpcs) {
    try {
      const payload = `f.req=${encodeURIComponent(JSON.stringify([[[rpc, JSON.stringify([shareId, null, null]), null, "generic"]]]))}`;
      const res = await fetch(`https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${rpc}&source-path=/share/${shareId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: payload
      });
      const text = await res.text();
      if (text.includes('wrb.fr') && !text.includes('null,null,null') && text.length > 500) {
        console.log(`=== SUCCESS with RPC ${rpc}! Length: ${text.length} ===`);
        console.log(text.slice(0, 2000));
      } else {
        console.log(`RPC ${rpc}: length ${text.length}`);
      }
    } catch (e) {
      console.error(`Error with ${rpc}:`, e.message);
    }
  }
}

fetchShare();
