import { supabase } from './supabase';

export class TestService {
  /**
   * Test OpenAI API connection
   */
  static async testOpenAI(): Promise<any> {
    try {
      console.log('🔍 Testing OpenAI API connection...');
      
      const { data, error } = await supabase.functions.invoke('test-openai', {
        body: {}
      });

      if (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
      }

      console.log('🔍 OpenAI Test Results:', data);
      return data;

    } catch (error: any) {
      console.error('❌ Test service error:', error);
      return { success: false, error: error.message };
    }
  }
}