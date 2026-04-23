// src/services/n8nService.js

/**
 * Service to handle sending messages via n8n Webhook.
 * It ensures formatting is preserved and correctly structured for Evolution API.
 */

// You can set this in your environment variables, e.g., VITE_N8N_WEBHOOK_URL
// For now, we fallback to a default configurable URL.
// Usamos una ruta relativa para pasar por el proxy configurado en Vite/Netlify y evitar CORS
const BASE_N8N_URL = '/api/n8n';
const N8N_WEBHOOK_URL = (import.meta.env.VITE_N8N_WEBHOOK_URL || '').replace('https://hooks.koratflow.agency', BASE_N8N_URL) || `${BASE_N8N_URL}/webhook/koratflow-evolution`;

export const n8nService = {
  /**
   * Envía un mensaje a través de n8n.
   * @param {Object} data 
   * @param {string} data.phone - Número de teléfono del destinatario.
   * @param {string} data.message - Contenido del mensaje (soporta saltos de línea y emojis).
   * @param {string} data.type - Tipo de mensaje (demo, rec_24h, rec_3h, post_cita, etc.).
   * @param {string} [data.lead_name] - Nombre del lead (opcional).
   * @param {string} [data.service] - Servicio de interés (opcional).
   * @returns {Promise<boolean>}
   */
  async sendMessage(data) {
    try {
      console.log('Enviando a n8n:', data);
      
      // Aseguramos que el teléfono esté limpio (solo números)
      const cleanPhone = data.phone?.replace(/\D/g, '') || '';

      const payload = {
        number: cleanPhone,
        text: data.message,
        type: data.type,
        lead_id: data.lead_id, // Agregado
        interaction_type: data.interaction_type, // Agregado
        interaction_step: data.interaction_step, // Agregado
        metadata: {
          leadName: data.lead_name || '',
          service: data.service || '',
          source: 'KoratFlow CRM'
        }
      };

      // Si la URL es la por defecto, simulamos éxito para que no falle la UI en desarrollo
      if (N8N_WEBHOOK_URL.includes('tu-n8n.com')) {
        console.warn('Usando URL de n8n por defecto. Simulando envío exitoso.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error en n8n: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error enviando mensaje por n8n:', error);
      throw error;
    }
  },

  /**
   * Permite actualizar la URL del webhook en tiempo de ejecución (útil para configuración en UI)
   * @param {string} url 
   */
  setWebhookUrl(url) {
    localStorage.setItem('n8n_webhook_url', url);
  },

  getWebhookUrl() {
    return localStorage.getItem('n8n_webhook_url') || '';
  }
};
