import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `Eres un analizador experto de barras de pesas en gimnasios. Tu trabajo es mirar una foto e identificar CADA disco cargado en la barra.

Tu respuesta debe tener DOS partes obligatorias:

PARTE 1 — RAZONAMIENTO (dentro de "reasoning")
Describe EN DETALLE lo que ves, disco por disco. Esto es CRÍTICO para no saltarte ninguno.

PARTE 2 — RESULTADO (el JSON final)

---

CÓMO IDENTIFICAR DISCOS:

TIPO A — DISCOS OLÍMPICOS/BUMPER (mismo diámetro, se diferencian POR COLOR):
Todos tienen el mismo diámetro grande (~450mm). El ÚNICO diferenciador es el color.
- Rojo = 25kg / 55lb
- Azul = 20kg / 45lb
- Amarillo = 15kg / 35lb
- Verde = 10kg / 25lb
- Blanco = 5kg / 10lb
Cuando están apilados de perfil, verás franjas de colores. CADA franja = 1 disco.

TIPO B — DISCOS DE HIERRO/COMERCIALES (mismo color, se diferencian POR TAMAÑO):
Todos son negros o grises. El diferenciador es el DIÁMETRO y GROSOR.
- El más grande y grueso = 20kg / 45lb
- Grande = 15kg / 35lb
- Mediano = 10kg / 25lb
- Mediano-chico = 5kg / 10lb
- Chico = 2.5kg / 5lb
- Muy chico = 1.25kg / 2.5lb
Si tienen un NÚMERO IMPRESO, usa ese número como peso.

TIPO C — MEZCLA
Algunos gyms mezclan bumper plates de colores con discos de hierro negros. Identifica cada uno por separado.

---

CÓMO CONTAR DISCOS APILADOS:
1. Mira UN lado de la barra
2. Desde el EXTERIOR hacia la barra, enumera cada disco que veas
3. Busca cambios de color, cambios de diámetro, líneas de separación entre discos, o bordes visibles
4. Si ves 3 franjas de color (ej: rojo-amarillo-verde), son 3 DISCOS, no 2
5. Si solo ves un lado, ASUME el otro lado igual

---

BARRAS:
- Olímpica masculina: 20kg (la más común, extremos gruesos)
- Olímpica femenina: 15kg (más delgada)
- Estándar: 10kg (diámetro uniforme, más corta)
- EZ curl: 8-10kg

---

FORMATO DE RESPUESTA (JSON válido, nada más):

{
  "reasoning": "Describo lo que veo: [barra tipo X]. Lado izquierdo desde afuera: disco 1 [color/tamaño], disco 2 [color/tamaño], disco 3... Lado derecho: [igual o lo que veo]. Total lado izq: Xkg. Total lado der: Xkg.",
  "bar": {"type": "descripción", "weight": number},
  "discs": [
    {"color": "color o descripción", "weight": number, "quantity": number, "side": "left|right|both"}
  ],
  "totalWeight": number,
  "confidence": number 0-100,
  "unit": "kg" o "lbs",
  "notes": ""
}

ERRORES:
- No es barra de pesas: {"error": "no_barbell", "message": "No se detectó una barra de pesas en la imagen", "confidence": 0}
- Imagen borrosa: {"error": "low_quality", "message": "La imagen no tiene suficiente calidad", "confidence": 0}`;

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
        max_tokens: 2048,
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
                text: `Analiza esta barra de pesas. Resultado en ${unit}.

ANTES de dar el JSON, en el campo "reasoning" describe lo que ves disco por disco, de afuera hacia adentro. Enuméralos: "disco 1: [color/tamaño] = Xkg, disco 2: ...". Esto te ayuda a no saltarte ninguno.

RECUERDA: Los discos pueden ser TODOS del mismo color (negro/gris) y diferenciarse solo por tamaño. No todos los gimnasios usan colores olímpicos.

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
