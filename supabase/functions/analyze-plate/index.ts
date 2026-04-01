import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `Eres un experto en equipamiento de gimnasio y halterofilia. Tu tarea es analizar fotos de barras de pesas y reconocer TODOS los discos cargados con máxima precisión.

PROCESO DE ANÁLISIS (sigue estos pasos en orden):

PASO 1 — IDENTIFICAR LA BARRA:
- Olímpica estándar = 20kg (la más común, diámetro grueso en extremos)
- Olímpica mujer = 15kg (más delgada y corta)
- Estándar = 10-15kg (diámetro uniforme)
- EZ curl = 8-10kg

PASO 2 — CONTAR DISCOS CON CUIDADO:
- Examina cada lado de la barra por separado
- Los discos están APILADOS uno contra otro. Mira los BORDES visibles entre discos
- Cada franja de color diferente que veas en el perfil de los discos apilados es un disco distinto
- ERRORES COMUNES: cuando hay 3+ discos apilados, es fácil saltarse el del medio. Cuenta las franjas de color una por una
- Si solo ves un lado, asume que el otro lado tiene la misma carga (es lo estándar)
- Mira también discos pequeños (change plates) que pueden estar ocultos detrás de los grandes

PASO 3 — IDENTIFICAR PESO POR COLOR (estándar IWF/olímpico):
Discos grandes (bumper plates, diámetro 450mm):
- Rojo = 25kg
- Azul = 20kg
- Amarillo = 15kg
- Verde = 10kg

Discos medianos y pequeños:
- Blanco = 5kg
- Negro = 2.5kg
- Rojo pequeño = 2.5kg
- Azul pequeño = 2kg
- Amarillo pequeño = 1.5kg
- Verde pequeño = 1kg
- Blanco pequeño = 0.5kg

Discos comerciales/gym: lee el número impreso.
Discos en libras: 45lb, 35lb, 25lb, 10lb, 5lb, 2.5lb.

PASO 4 — VERIFICAR EL CÁLCULO:
- Suma lado izquierdo disco por disco
- Suma lado derecho disco por disco
- Total = barra + izquierdo + derecho
- VERIFICA que la suma sea correcta antes de responder

RESPONDE ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{
  "bar": {"type": "descripción de la barra", "weight": number},
  "discs": [
    {"color": "color del disco", "weight": number, "quantity": number, "side": "left|right|both"}
  ],
  "totalWeight": number,
  "confidence": number entre 0 y 100,
  "unit": "kg" o "lbs",
  "notes": "observaciones relevantes o string vacío"
}

Si la imagen no muestra una barra de pesas:
{"error": "no_barbell", "message": "No se detectó una barra de pesas en la imagen", "confidence": 0}

Si la imagen es muy borrosa o los discos no se distinguen:
{"error": "low_quality", "message": "La imagen no tiene suficiente calidad para un análisis preciso", "confidence": 0}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verificar autenticación
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { image_base64, unit = "kg" } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "Falta image_base64 en el body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Llamar a Claude Vision
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image_base64,
                },
              },
              {
                type: "text",
                text: `Analiza esta foto de una barra de pesas. Devuelve el resultado en ${unit}.

IMPORTANTE: Mira con mucho cuidado el perfil lateral de los discos apilados. Cada franja de color distinta es un disco separado. Los discos bumper olímpicos suelen apilarse rojo(25)+amarillo(15)+verde(10) o combinaciones similares. NO te saltes ningún disco del medio.

Si solo puedes ver un lado de la barra, asume que el otro lado tiene exactamente los mismos discos.

Responde SOLO con JSON válido.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", errorBody);
      return new Response(
        JSON.stringify({
          error: "api_error",
          message: "Error al comunicarse con la IA",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({
          error: "parse_error",
          message: "No se pudo interpretar la respuesta de la IA",
          raw: content,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "Error interno del servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
