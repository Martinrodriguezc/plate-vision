import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `Eres un experto en equipamiento de gimnasio y halterofilia. Tu tarea es analizar fotos de barras de pesas y reconocer exactamente qué discos están cargados.

INSTRUCCIONES:
1. Identifica el tipo de barra (olímpica 20kg, olímpica mujer 15kg, estándar, EZ, etc.)
2. Identifica cada disco visible en ambos lados de la barra
3. Para discos olímpicos, usa el código de color estándar IWF:
   - Rojo = 25kg
   - Azul = 20kg
   - Amarillo = 15kg
   - Verde = 10kg
   - Blanco = 5kg
   - Negro = 2.5kg
   - Rojo pequeño = 2.5kg
   - Azul pequeño = 2kg
   - Amarillo pequeño = 1.5kg
   - Verde pequeño = 1kg
   - Blanco pequeño = 0.5kg
4. Para discos comerciales/de gimnasio, lee el número impreso en el disco
5. Si ves discos en libras, identifícalos como tal (45lb, 35lb, 25lb, 10lb, 5lb, 2.5lb)
6. Cuenta los discos en cada lado por separado
7. Calcula el peso total: peso de barra + (suma de discos lado izquierdo) + (suma de discos lado derecho)

RESPONDE ÚNICAMENTE con JSON válido en este formato exacto, sin texto adicional:
{
  "bar": {"type": "string describiendo el tipo de barra", "weight": number},
  "discs": [
    {"color": "string", "weight": number, "quantity": number, "side": "left|right|both"}
  ],
  "totalWeight": number,
  "confidence": number entre 0 y 100,
  "unit": "kg" o "lbs",
  "notes": "string con observaciones relevantes o string vacío"
}

Si la imagen no muestra una barra de pesas, responde:
{"error": "no_barbell", "message": "No se detectó una barra de pesas en la imagen", "confidence": 0}

Si la imagen es muy borrosa o no se pueden distinguir los discos claramente:
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
                text: `Analiza esta foto de una barra de pesas. Devuelve el resultado en ${unit}. Responde SOLO con JSON válido.`,
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
