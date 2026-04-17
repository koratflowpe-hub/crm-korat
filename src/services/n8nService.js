/**
 * High-level service for n8n interactions.
 * Sends structured context to the webhook defined in .env
 */

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

class N8nService {
  /**
   * Universal trigger for AI help within the script editor.
   * @param {string} action - Descriptive action (e.g., 'assist')
   * @param {Object} context - All relevant data from the script and pillar
   * @param {string} instruction - Optional user instruction (e.g. "make it funnier")
   */
  async triggerScriptAi(action, context, instruction = '') {
    if (!WEBHOOK_URL) {
      console.error("n8n Webhook URL is not configured in .env");
      throw new Error("Configuración de IA no encontrada.");
    }

    const payload = {
      action,
      timestamp: new Date().toISOString(),
      user_instruction: instruction,
      // Flat properties for backward compatibility
      script_id: context?.script_id,
      title: context?.title,
      current_content: context?.current_content || '',
      field_target: context?.field_target,
      block_id: context?.block_id || null,
      pillar_id: context?.pillar_id,
      pillar_name: context?.pillar_name || 'Sin pilar',
      pillar_description: context?.pillar_description || '',
      pillar_objective: context?.pillar_objective || '',
      pillar_keywords: context?.pillar_keywords || [],
      user_id: context?.user_id,
      raw_text: context?.raw_text || '',
      
      // Nested objects for newer workflow logic
      script: {
        id: context?.script_id,
        title: context?.title,
        current_content: context?.current_content || '',
        field_target: context?.field_target,
        block_id: context?.block_id || null,
        master_draft: context?.master_draft || '',
        video_copy: context?.video_copy || '',
        shot_list: context?.shot_list || '',
        lighting_setup: context?.lighting_setup || '',
        camera_setup: context?.camera_setup || '',
        hashtags: context?.hashtags || '',
        blocks: context?.full_blocks || []
      },
      pillar: {
        id: context?.pillar_id,
        name: context?.pillar_name || 'Sin pilar',
        description: context?.pillar_description || '',
        objective: context?.pillar_objective || '',
        keywords: context?.pillar_keywords || []
      }
    };

    try {
      const response = await fetch(`${WEBHOOK_URL}guion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`n8n error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to trigger n8n assistance:", error);
      throw error;
    }
  }

  /**
   * Generates strategic content pillars based on brand niche.
   */
  async triggerPillarAi(brandContext) {
    if (!WEBHOOK_URL) throw new Error("Configuración de IA no encontrada.");

    const payload = {
      action: 'brainstorm_pillars',
      brand: brandContext,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${WEBHOOK_URL}guion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`n8n error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to generate pillars:", error);
      throw error;
    }
  }
}

export const n8nService = new N8nService();
