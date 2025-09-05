import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  outfitId: string;
  imagePath: string;
  userId: string;
  userStylePreferences: string[];
}

interface OutfitAnalysis {
  overall_score: number;
  style_category: string;
  style_score: number;
  fit_score: number;
  color_score: number;
  occasion_appropriateness: number;
  detailed_feedback: {
    strengths: string[];
    improvements: string[];
    style_alignment: string;
  };
  items_detected: {
    category: string;
    description: string;
    fit_assessment: string;
  }[];
}

interface ClinicalAnalysis extends OutfitAnalysis {
  sub_scores: {
    proportion_silhouette: number;
    fit_technical: number;
    color_harmony: number;
    pattern_texture: number;
    layering_logic: number;
    formality_occasion: number;
    footwear_cohesion: number;
  };
  garment_detection: {
    item_id: string;
    category: string;
    attributes: {
      fit: string;
      color: string;
      pattern: string;
      material: string;
      length?: string;
      sleeve_length?: string;
      neckline?: string;
      waistline?: string;
      hem_treatment?: string;
      layer_order?: number;
    };
    confidence_scores: {
      [key: string]: number;
    };
  }[];
  outfit_assessment: {
    proportions: {
      top_length_ratio: number;
      silhouette_shape: string;
    };
    layering: {
      weight_order: string[];
      hem_order: string[];
    };
    color_analysis: {
      palette: string[];
      scheme: string;
      outliers: string[];
    };
    formality_level: {
      score: number;
      reasoning: string;
    };
    micro_adjustments: {
      tuck_status: string;
      sleeves: string;
      cuffs: string;
    };
  };
  recommendations: {
    minor_adjustments: string[];
    detected_closet_items: {
      category: string;
      attributes: any;
      confidence: number;
    }[];
    closet_recommendations: string[];
    new_item_suggestions: string[];
  };
  confidence_flags: string[];
  analysis_completeness: number;
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
      throw new Error('OPENAI_API_KEY not configured. Please set it in Supabase Dashboard > Edge Functions > Secrets')
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    const { outfitId, imagePath, userId, userStylePreferences } = await req.json() as AnalysisRequest
    
    console.log('Processing outfit analysis:', { outfitId, imagePath, userId })

    // Get signed URL for the image
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('private-uploads')
      .createSignedUrl(imagePath, 300) // 5 minutes

    if (signedUrlError) {
      throw new Error(`Failed to get signed URL: ${signedUrlError.message}`)
    }

    console.log('🔍 About to call OpenAI Vision API with:')
    console.log('- Model: gpt-4o-mini')  
    console.log('- Image URL length:', signedUrlData.signedUrl.length)
    console.log('- User preferences:', userStylePreferences)
    
    // Call OpenAI Vision API
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
            content: `You are a professional fashion analyst providing clinical outfit evaluation.

TASK: Analyze outfit photo and provide structured feedback with detailed scoring.

USER PREFERENCES (prioritize these): ${userStylePreferences.join(', ')}

SCORING SYSTEM (0-100 scale):
- Proportion/Silhouette (25%): body proportions, fit balance
- Technical Fit (20%): garment construction, tailoring
- Color Harmony (20%): palette coordination, contrast
- Pattern/Texture (10%): scale balance, material mix
- Layering Logic (10%): weight order, hem placement
- Formality/Occasion (10%): appropriateness for setting
- Footwear Cohesion (5%): style/color integration

DETECTION: For each garment, identify category, fit, color, pattern, material with confidence scores (0-1).

OUTPUT: Professional tone, specific measurements, actionable recommendations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this outfit photo and provide detailed feedback. 
                
User's style preferences: ${userStylePreferences.join(', ')}

Return JSON with this structure:
{
  "overall_score": <1-100>,
  "style_category": "<primary_style>",
  "style_score": <1-100>,
  "fit_score": <1-100>,
  "color_score": <1-100>,
  "occasion_appropriateness": <1-100>,
  "sub_scores": {
    "proportion_silhouette": <1-100>,
    "fit_technical": <1-100>,
    "color_harmony": <1-100>,
    "pattern_texture": <1-100>,
    "layering_logic": <1-100>,
    "formality_occasion": <1-100>,
    "footwear_cohesion": <1-100>
  },
  "detailed_feedback": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "style_alignment": "user preference match assessment"
  },
  "items_detected": [{"category": "type", "description": "desc", "fit_assessment": "fit"}],
  "garment_detection": [{
    "item_id": "id",
    "category": "type",
    "attributes": {"fit": "fit", "color": "color", "pattern": "pattern", "material": "material"},
    "confidence_scores": {"fit": 0.8, "color": 0.9, "pattern": 0.7}
  }],
  "outfit_assessment": {
    "proportions": {"top_length_ratio": 0.6, "silhouette_shape": "shape"},
    "color_analysis": {"palette": ["color1"], "scheme": "scheme", "outliers": []},
    "formality_level": {"score": 75, "reasoning": "reason"}
  },
  "recommendations": {
    "minor_adjustments": ["adjustment1"],
    "detected_closet_items": [{"category": "type", "attributes": {}, "confidence": 0.8}],
    "closet_recommendations": ["rec1"],
    "new_item_suggestions": ["suggestion1"]
  },
  "confidence_flags": ["flag1"],
  "analysis_completeness": 95
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
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error(`OpenAI API Error: ${openAIResponse.status} - ${errorText}`)
      console.error('Request details:', {
        model: 'gpt-4o-mini',
        systemPromptLength: `You are a professional fashion analysis AI...`.length,
        imageUrlLength: signedUrlData.signedUrl.length,
        maxTokens: 2000,
        temperature: 0.7
      })
      throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorText}`)
    }

    const openAIResult = await openAIResponse.json()
    const analysisText = openAIResult.choices[0].message.content
    
    console.log('✅ OpenAI API Response received successfully')
    console.log('Raw OpenAI response length:', analysisText.length, 'characters')

    let analysis: ClinicalAnalysis
    let usingFallback = false
    
    try {
      // Extract JSON from the response (it might have markdown formatting)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedAnalysis = JSON.parse(jsonMatch[0])
        
        // Handle both legacy and new format - convert legacy to clinical format
        if (parsedAnalysis.sub_scores) {
          // New clinical format
          analysis = parsedAnalysis as ClinicalAnalysis
          console.log('✅ Successfully parsed Clinical Analysis JSON')
        } else {
          // Legacy format - convert to clinical format
          analysis = {
            ...parsedAnalysis,
            sub_scores: {
              proportion_silhouette: parsedAnalysis.style_score || 70,
              fit_technical: parsedAnalysis.fit_score || 70,
              color_harmony: parsedAnalysis.color_score || 70,
              pattern_texture: 70,
              layering_logic: 70,
              formality_occasion: parsedAnalysis.occasion_appropriateness || 70,
              footwear_cohesion: 70
            },
            garment_detection: parsedAnalysis.items_detected?.map((item: any, index: number) => ({
              item_id: `item_${index}`,
              category: item.category,
              attributes: {
                fit: item.fit_assessment,
                color: 'unknown',
                pattern: 'unknown',
                material: 'unknown'
              },
              confidence_scores: {
                fit: 0.7,
                color: 0.5,
                pattern: 0.5
              }
            })) || [],
            outfit_assessment: {
              proportions: {
                top_length_ratio: 0.5,
                silhouette_shape: 'unknown'
              },
              layering: {
                weight_order: [],
                hem_order: []
              },
              color_analysis: {
                palette: [],
                scheme: 'unknown',
                outliers: []
              },
              formality_level: {
                score: parsedAnalysis.occasion_appropriateness || 70,
                reasoning: 'Legacy format conversion'
              },
              micro_adjustments: {
                tuck_status: 'unknown',
                sleeves: 'unknown',
                cuffs: 'unknown'
              }
            },
            recommendations: {
              minor_adjustments: parsedAnalysis.detailed_feedback?.improvements || [],
              detected_closet_items: [],
              closet_recommendations: [],
              new_item_suggestions: []
            },
            confidence_flags: ['Converted from legacy format'],
            analysis_completeness: 70
          } as ClinicalAnalysis
          console.log('✅ Successfully converted legacy analysis to clinical format')
        }
        
        console.log('Analysis scores:', {
          overall: analysis.overall_score,
          style: analysis.style_score,
          fit: analysis.fit_score,
          color: analysis.color_score,
          occasion: analysis.occasion_appropriateness
        })
      } else {
        throw new Error('No JSON found in OpenAI response')
      }
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError)
      console.error('Raw response that failed to parse:', analysisText.substring(0, 500) + '...')
      usingFallback = true
      
      // Fallback analysis if parsing fails
      analysis = {
        overall_score: 70,
        style_category: 'casual',
        style_score: 70,
        fit_score: 70,
        color_score: 70,
        occasion_appropriateness: 70,
        sub_scores: {
          proportion_silhouette: 70,
          fit_technical: 70,
          color_harmony: 70,
          pattern_texture: 70,
          layering_logic: 70,
          formality_occasion: 70,
          footwear_cohesion: 70
        },
        detailed_feedback: {
          strengths: ['Good outfit choice'],
          improvements: ['Analysis parsing failed - please try again'],
          style_alignment: 'Unable to fully analyze due to technical issue'
        },
        items_detected: [{
          category: 'outfit',
          description: 'Full outfit visible',
          fit_assessment: 'Unable to assess due to parsing error'
        }],
        garment_detection: [{
          item_id: 'fallback_item',
          category: 'outfit',
          attributes: {
            fit: 'unknown',
            color: 'unknown',
            pattern: 'unknown',
            material: 'unknown'
          },
          confidence_scores: {
            fit: 0.1,
            color: 0.1,
            pattern: 0.1
          }
        }],
        outfit_assessment: {
          proportions: {
            top_length_ratio: 0.5,
            silhouette_shape: 'unknown'
          },
          layering: {
            weight_order: [],
            hem_order: []
          },
          color_analysis: {
            palette: [],
            scheme: 'unknown',
            outliers: []
          },
          formality_level: {
            score: 70,
            reasoning: 'Fallback assessment - analysis failed'
          },
          micro_adjustments: {
            tuck_status: 'unknown',
            sleeves: 'unknown',
            cuffs: 'unknown'
          }
        },
        recommendations: {
          minor_adjustments: ['Please retry analysis'],
          detected_closet_items: [],
          closet_recommendations: [],
          new_item_suggestions: []
        },
        confidence_flags: ['Analysis parsing failed', 'Using fallback data'],
        analysis_completeness: 10
      }
      console.log('⚠️ Using fallback analysis due to parsing error')
    }

    // Update outfit record with analysis results
    const { error: updateError } = await supabaseClient
      .from('outfits')
      .update({
        processing_status: 'completed',
        analysis_result: analysis,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', outfitId)

    if (updateError) {
      throw new Error(`Failed to update outfit: ${updateError.message}`)
    }

    // Insert outfit score record with clinical data
    const { error: scoreError } = await supabaseClient
      .from('outfit_scores')
      .insert({
        outfit_id: outfitId,
        user_id: userId,
        overall_score: analysis.overall_score, // 1-100 scale
        style_score: analysis.style_score,
        fit_score: analysis.fit_score,
        color_score: analysis.color_score,
        occasion_score: analysis.occasion_appropriateness,
        sub_scores: analysis.sub_scores,
        analysis_completeness: analysis.analysis_completeness || 100,
        confidence_flags: analysis.confidence_flags || [],
        feedback: analysis.detailed_feedback,
        detected_items: analysis.items_detected
      })

    if (scoreError) {
      console.error('Failed to insert score:', scoreError)
      // Don't throw here - analysis was successful even if score insert failed
    }

    // Store detailed garment detection data if available
    if (analysis.garment_detection && analysis.garment_detection.length > 0) {
      const detectionInserts = analysis.garment_detection.map(garment => ({
        outfit_id: outfitId,
        item_id: garment.item_id,
        category: garment.category,
        fit_assessment: garment.attributes.fit,
        color: garment.attributes.color,
        pattern: garment.attributes.pattern,
        material: garment.attributes.material,
        length: garment.attributes.length,
        sleeve_length: garment.attributes.sleeve_length,
        neckline: garment.attributes.neckline,
        waistline: garment.attributes.waistline,
        hem_treatment: garment.attributes.hem_treatment,
        layer_order: garment.attributes.layer_order,
        confidence_scores: garment.confidence_scores,
        all_attributes: garment.attributes
      }))

      const { error: detectionError } = await supabaseClient
        .from('garment_detection')
        .insert(detectionInserts)

      if (detectionError) {
        console.error('Failed to insert garment detection:', detectionError)
        // Continue - this is supplementary data
      }
    }

    // Store outfit assessment data if available  
    if (analysis.outfit_assessment) {
      const { error: assessmentError } = await supabaseClient
        .from('outfit_assessment')
        .insert({
          outfit_id: outfitId,
          top_length_ratio: analysis.outfit_assessment.proportions?.top_length_ratio,
          silhouette_shape: analysis.outfit_assessment.proportions?.silhouette_shape,
          weight_order: analysis.outfit_assessment.layering?.weight_order || [],
          hem_order: analysis.outfit_assessment.layering?.hem_order || [],
          color_palette: analysis.outfit_assessment.color_analysis?.palette || [],
          color_scheme: analysis.outfit_assessment.color_analysis?.scheme,
          color_outliers: analysis.outfit_assessment.color_analysis?.outliers || [],
          formality_score: analysis.outfit_assessment.formality_level?.score,
          formality_reasoning: analysis.outfit_assessment.formality_level?.reasoning,
          tuck_status: analysis.outfit_assessment.micro_adjustments?.tuck_status,
          sleeve_adjustments: analysis.outfit_assessment.micro_adjustments?.sleeves,
          cuff_adjustments: analysis.outfit_assessment.micro_adjustments?.cuffs,
          full_assessment: analysis.outfit_assessment
        })

      if (assessmentError) {
        console.error('Failed to insert outfit assessment:', assessmentError)
        // Continue - this is supplementary data
      }
    }

    // Store recommendations if available
    if (analysis.recommendations) {
      const recommendationInserts = []

      // Minor adjustments
      if (analysis.recommendations.minor_adjustments) {
        analysis.recommendations.minor_adjustments.forEach(adjustment => {
          recommendationInserts.push({
            outfit_id: outfitId,
            recommendation_type: 'minor_adjustment',
            adjustment_description: adjustment,
            confidence: 0.8
          })
        })
      }

      // New item suggestions  
      if (analysis.recommendations.new_item_suggestions) {
        analysis.recommendations.new_item_suggestions.forEach(suggestion => {
          recommendationInserts.push({
            outfit_id: outfitId,
            recommendation_type: 'new_purchase',
            item_description: suggestion,
            confidence: 0.7
          })
        })
      }

      if (recommendationInserts.length > 0) {
        const { error: recommendationError } = await supabaseClient
          .from('outfit_recommendations')
          .insert(recommendationInserts)

        if (recommendationError) {
          console.error('Failed to insert recommendations:', recommendationError)
          // Continue - this is supplementary data
        }
      }
    }

    // Log final analysis source
    if (usingFallback) {
      console.log('🔄 Analysis completed using FALLBACK data (check OpenAI API key and response format)')
    } else {
      console.log('🎯 Analysis completed using REAL OpenAI Vision analysis')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        outfitId,
        source: usingFallback ? 'fallback' : 'openai'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error in analyze-outfit function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze outfit',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})