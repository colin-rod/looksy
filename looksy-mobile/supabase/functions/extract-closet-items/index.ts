import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractionRequest {
  imagePath: string;
  userId: string;
  extractionType: 'outfit' | 'individual_items'; // outfit = multiple items, individual_items = single items
}

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width?: number;
  height?: number;
}

interface ExtractedItem {
  item_id: string;
  category: string;
  description: string;
  bounding_box: BoundingBox;
  attributes: {
    color: string;
    pattern: string;
    material: string;
    brand?: string;
    size_estimate?: string;
    style_tags: string[];
    formality_level: number; // 1-100
    season_tags: string[];
  };
  confidence_scores: {
    detection: number; // How confident AI is this item exists
    isolation: number; // How well can this item be cropped out
    attributes: number; // How accurate are the identified attributes
  };
  closet_suitability: number; // 0-1 score for how suitable this is for closet tracking
}

interface ExtractionResult {
  success: boolean;
  extraction_id: string;
  items: ExtractedItem[];
  processing_metadata: {
    image_dimensions: { width: number; height: number };
    processing_time_ms: number;
    ai_model_used: string;
    total_items_detected: number;
    high_confidence_items: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openAIKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    if (!openAIKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    const startTime = Date.now()

    const { imagePath, userId, extractionType } = await req.json() as ExtractionRequest
    
    console.log('Starting closet item extraction:', { imagePath, userId, extractionType })

    // Get signed URL for the image
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('private-uploads')
      .createSignedUrl(imagePath, 300)

    if (signedUrlError) {
      throw new Error(`Failed to get signed URL: ${signedUrlError.message}`)
    }

    console.log('🔍 Calling OpenAI Vision API for item extraction')
    
    // Enhanced prompt for item extraction and isolation
    const systemPrompt = `You are a professional wardrobe cataloging AI. Your task is to extract individual clothing items from photos for digital closet management.

EXTRACTION PROCESS:
1. DETECT: Identify each distinct clothing item
2. LOCATE: Provide bounding box coordinates for cropping
3. DESCRIBE: Generate detailed item descriptions
4. ASSESS: Evaluate isolation feasibility and closet suitability

FOR EACH CLOTHING ITEM:
- Provide precise bounding box coordinates (x1,y1,x2,y2) as percentages of image dimensions
- Allow bounding boxes to overlap naturally when items layer over each other (e.g., shirt over pants, jacket over shirt)
- Include the full extent of each item even if partially covered by other garments
- Generate detailed description suitable for wardrobe cataloging
- Identify all visible attributes with confidence scoring
- Assess how cleanly the item can be isolated from background
- Rate suitability for closet tracking and cataloging

FOCUS ON: Main clothing pieces (tops, bottoms, dresses, outerwear, shoes) AND accessories (bags, hats, belts, scarves, jewelry, watches, bracelets, necklaces, earrings, rings)
AVOID: Glasses, undergarments, partial items, reflections, sunglasses

LAYERING EXAMPLES:
- A cropped shirt over high-waisted pants: shirt box extends to natural hem, pants box starts at waistband, both boxes overlap at waist area
- A jacket over a shirt: jacket box includes full jacket, shirt box includes full shirt, boxes overlap where shirt is visible
- Accessories like belts: should overlap with pants/dress they're worn over

OUTPUT: Professional tone, precise measurements, comprehensive attributes.`

    const userPrompt = extractionType === 'outfit' 
      ? `Extract all individual clothing items from this outfit photo for closet cataloging. Focus on main garments that can be cleanly separated and cataloged.`
      : `Catalog this individual clothing item with detailed attributes for wardrobe management.`

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${userPrompt}

Return JSON with this exact structure:
{
  "items": [
    {
      "item_id": "unique_identifier",
      "category": "shirt|pants|dress|shoes|jacket|bag|hat|belt|scarf|jewelry|watch|necklace|bracelet|earrings|ring|etc",
      "description": "detailed_item_description",
      "bounding_box": {
        "x1": <0-100_percentage>,
        "y1": <0-100_percentage>, 
        "x2": <0-100_percentage>,
        "y2": <0-100_percentage>
      },
      "attributes": {
        "color": "primary_color",
        "pattern": "solid|striped|plaid|floral|etc",
        "material": "cotton|wool|polyester|etc",
        "brand": "brand_if_visible",
        "size_estimate": "XS|S|M|L|XL|estimated_size",
        "style_tags": ["casual", "formal", "vintage", "etc"],
        "formality_level": <1-100_number>,
        "season_tags": ["spring", "summer", "fall", "winter", "all-season"]
      },
      "confidence_scores": {
        "detection": <0.0-1.0>,
        "isolation": <0.0-1.0>,
        "attributes": <0.0-1.0>
      },
      "closet_suitability": <0.0-1.0>
    }
  ],
  "image_analysis": {
    "estimated_dimensions": {"width": <pixels>, "height": <pixels>},
    "lighting_quality": "excellent|good|fair|poor",
    "background_complexity": "simple|moderate|complex"
  }
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: signedUrlData.signedUrl
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.3 // Lower temperature for more consistent extraction
      })
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error(`OpenAI API Error: ${openAIResponse.status} - ${errorText}`)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIResult = await openAIResponse.json()
    const analysisText = openAIResult.choices[0].message.content
    
    console.log('✅ OpenAI extraction completed')
    console.log('Raw response length:', analysisText.length)

    // Parse the extraction results
    let extractionData: any
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractionData = JSON.parse(jsonMatch[0])
        console.log('✅ Successfully parsed extraction JSON')
      } else {
        throw new Error('No JSON found in OpenAI response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse extraction response:', parseError)
      // Return empty extraction result
      extractionData = {
        items: [],
        image_analysis: {
          estimated_dimensions: { width: 1000, height: 1000 },
          lighting_quality: 'unknown',
          background_complexity: 'unknown'
        }
      }
    }

    // Create extraction record in database
    const extractionId = crypto.randomUUID()
    const processingTime = Date.now() - startTime

    const { error: extractionInsertError } = await supabaseClient
      .from('photo_extractions')
      .insert({
        id: extractionId,
        user_id: userId,
        original_image_path: imagePath,
        processing_status: 'completed',
        extracted_items_count: extractionData.items?.length || 0,
        processing_metadata: {
          image_dimensions: extractionData.image_analysis?.estimated_dimensions || { width: 0, height: 0 },
          processing_time_ms: processingTime,
          ai_model_used: 'gpt-4o-mini',
          total_items_detected: extractionData.items?.length || 0,
          high_confidence_items: extractionData.items?.filter((item: any) => item.closet_suitability > 0.7).length || 0,
          lighting_quality: extractionData.image_analysis?.lighting_quality,
          background_complexity: extractionData.image_analysis?.background_complexity
        }
      })

    if (extractionInsertError) {
      console.error('Failed to insert extraction record:', extractionInsertError)
    }

    // Store individual extracted items
    if (extractionData.items && extractionData.items.length > 0) {
      const itemInserts = extractionData.items.map((item: any) => ({
        id: crypto.randomUUID(),
        photo_extraction_id: extractionId,
        bounding_box: item.bounding_box,
        ai_description: item.description,
        extraction_confidence: item.closet_suitability,
        item_category: item.category,
        item_attributes: item.attributes,
        confidence_scores: item.confidence_scores
      }))

      const { error: itemsInsertError } = await supabaseClient
        .from('extracted_clothing_items')
        .insert(itemInserts)

      if (itemsInsertError) {
        console.error('Failed to insert extracted items:', itemsInsertError)
      }
    }

    const result: ExtractionResult = {
      success: true,
      extraction_id: extractionId,
      items: extractionData.items || [],
      processing_metadata: {
        image_dimensions: extractionData.image_analysis?.estimated_dimensions || { width: 0, height: 0 },
        processing_time_ms: processingTime,
        ai_model_used: 'gpt-4o-mini',
        total_items_detected: extractionData.items?.length || 0,
        high_confidence_items: extractionData.items?.filter((item: any) => item.closet_suitability > 0.7).length || 0
      }
    }

    console.log(`🎯 Extraction completed: ${result.items.length} items detected`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in extract-closet-items function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to extract closet items',
        extraction_id: null,
        items: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})