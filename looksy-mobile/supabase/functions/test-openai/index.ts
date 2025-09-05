import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    
    console.log('Environment check:')
    console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅ Set' : '❌ Missing')
    console.log('OPENAI_API_KEY:', openAIKey ? `✅ Set (${openAIKey.substring(0, 7)}...)` : '❌ Missing')
    
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OPENAI_API_KEY not set in Supabase environment variables',
          instructions: 'Go to Supabase Dashboard > Project Settings > Edge Functions > Secrets and add OPENAI_API_KEY'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Test OpenAI API with a simple request
    console.log('Testing OpenAI API connection...')
    
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      }
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('OpenAI API test failed:', testResponse.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API test failed: ${testResponse.status}`,
          details: errorText,
          apiKeyPrefix: openAIKey.substring(0, 10) + '...'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const models = await testResponse.json()
    console.log('✅ OpenAI API connection successful')
    console.log('Available models count:', models.data?.length || 0)

    // Test if gpt-4o-mini is available
    const hasGpt4oMini = models.data?.some((model: any) => model.id === 'gpt-4o-mini')
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OpenAI API is working correctly',
        apiKeyPrefix: openAIKey.substring(0, 10) + '...',
        modelsAvailable: models.data?.length || 0,
        hasGpt4oMini,
        sampleModels: models.data?.slice(0, 5).map((m: any) => m.id) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Test function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Test function failed',
        details: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})