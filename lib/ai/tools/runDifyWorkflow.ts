export const runDifyWorkflow=async(params:any,apiKey:string,session:any)=>{
    
    let user=session&&session.user ?session.user.email:'v0'
    const response = await fetch('https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { ...params },
        response_mode: "blocking",
        user: user
      }),
    })
  
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`+apiKey+JSON.stringify(response));
    }
  
    const data = await response.json()
    return data
  }