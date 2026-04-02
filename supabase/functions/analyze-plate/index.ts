import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
};

// ═══════════════════════════════════════════
// PASADA 1: Localizar la barra y las zonas de discos
// ═══════════════════════════════════════════

const LOCATE_PROMPT = `Eres un sistema de detección de barras de pesas en fotos de gimnasio.

Tu ÚNICA tarea es identificar la barra y decirme DÓNDE están los discos en la imagen.

La barra es una LÍNEA RECTA DELGADA (horizontal o vertical). Los discos están ENSARTADOS en sus extremos (mangas), apilados uno contra otro.

IGNORA completamente discos que estén en el piso, en racks, contra paredes, o en cualquier lugar que NO sea la barra.

Responde ÚNICAMENTE con este JSON:
{
  "barbell_found": true/false,
  "orientation": "horizontal" | "vertical",
  "best_visible_side": "left" | "right",
  "disc_region": {
    "x_percent": number (0-100, centro X de la zona de discos del mejor lado visible),
    "y_percent": number (0-100, centro Y de la zona de discos),
    "width_percent": number (0-100, ancho de la zona a recortar),
    "height_percent": number (0-100, alto de la zona a recortar)
  },
  "estimated_disc_count": number (cuántos discos CREES que hay en el mejor lado visible),
  "bar_type": "olimpica_masculina_20kg" | "olimpica_femenina_15kg" | "estandar_10kg" | "ez_curl_8kg"
}

Si no hay barra: {"barbell_found": false}`;

// ═══════════════════════════════════════════
// PASADA 2: Analizar los discos en detalle
// ═══════════════════════════════════════════

const ANALYZE_PROMPT = `Eres un sistema de visión artificial especializado en identificar discos de pesas. Estás viendo una imagen RECORTADA/ZOOM de UN LADO de una barra de pesas. Solo ves los discos apilados.

═══ TABLA DE REFERENCIA ═══

DISCOS OLÍMPICOS GRANDES (bumper, mismo diámetro 450mm, por COLOR):
| Color    | Peso  | Grosor |
|----------|-------|--------|
| Rojo     | 25 kg | 33 mm  |
| Azul     | 20 kg | 26 mm  |
| Amarillo | 15 kg | 22 mm  |
| Verde    | 10 kg | 19 mm  |
| Blanco   |  5 kg | 14 mm  |

DISCOS FRACCIONARIOS (change plates, diámetro menor, metal con borde de color):
| Color borde | Peso    |
|-------------|---------|
| Blanco      | 5 kg    |
| Rojo        | 2.5 kg  |
| Azul        | 2 kg    |
| Amarillo    | 1.5 kg  |
| Verde       | 1 kg    |
| Blanco      | 0.5 kg  |
Patrón: mismos colores que los grandes pero 10x menor peso.

DISCOS COMERCIALES/CROSSFIT: pueden ser NEGROS con franja de color, o todos iguales. Busca número impreso.

DISCOS DE HIERRO (negros/grises, por TAMAÑO): 20kg(muy grande), 15kg(grande), 10kg(mediano), 5kg(med-chico), 2.5kg(chico), 1.25kg(muy chico).

═══ PROCESO (OBLIGATORIO) ═══

PASO 1: Recorre los discos de AFUERA hacia ADENTRO. En cada posición busca:
- Cambio de COLOR
- Cambio de DIÁMETRO (disco más chico detrás de uno grande)
- RELIEVE, borde, línea de separación, sombra entre discos
- Cambio de TEXTURA (goma vs metal, rugoso vs liso)
Enumera: "Disco 1 (externo): [descripción] → Xkg"
Sigue hasta el COLLARÍN (clip metálico, NO es disco) o manga vacía.

PASO 2: BÚSQUEDA DE DISCOS PEQUEÑOS entre el último bumper y el collarín:
- Discos blancos/cromados (5kg, 0.5kg): metal brillante, muy finos
- Discos negros (2.5kg, 1.25kg): hierro fundido, parecen sombras
- Discos grises (0.25-2.5kg): metal pulido, como arandela gruesa
- Cualquier franja delgada de diferente textura/color ES un disco

PASO 3: VERIFICACIÓN de adentro hacia afuera. Confirma el conteo.

Responde ÚNICAMENTE con JSON:
{
  "reasoning": "Disco 1: [desc] = Xkg. Disco 2: [desc] = Xkg. ...",
  "plates": [
    {"index": 1, "color": "string", "weight": number, "confidence": number}
  ],
  "side_total": number,
  "confidence": number
}`;

// ═══════════════════════════════════════════

async function callClaude(system: string, userContent: any[]): Promise<any> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic API error:", err);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const { image_base64, unit = "kg" } = await req.json();
    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "Falta image_base64" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const imageBlock = {
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: image_base64 },
    };

    // ══ PASADA 1: Localizar barra y discos ══
    console.log("Pass 1: Locating barbell...");
    const location = await callClaude(LOCATE_PROMPT, [
      imageBlock,
      { type: "text", text: "¿Dónde está la barra y sus discos? Responde solo JSON." },
    ]);

    if (!location.barbell_found) {
      return new Response(
        JSON.stringify({ error: "no_barbell", message: "No se detectó una barra de pesas", confidence: 0 }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    console.log("Pass 1 result:", JSON.stringify(location));

    // Determinar peso de barra
    const barWeights: Record<string, number> = {
      "olimpica_masculina_20kg": 20,
      "olimpica_femenina_15kg": 15,
      "estandar_10kg": 10,
      "ez_curl_8kg": 8,
    };
    const barWeight = barWeights[location.bar_type] ?? 20;
    const barType = location.bar_type?.replace(/_/g, " ").replace(/\d+kg/, "").trim() ?? "olímpica";

    // ══ PASADA 2: Analizar discos en detalle ══
    // Mandamos la imagen completa pero le decimos qué lado mirar
    console.log("Pass 2: Analyzing plates in detail...");
    const side = location.best_visible_side ?? "right";

    const analysis = await callClaude(ANALYZE_PROMPT, [
      imageBlock,
      {
        type: "text",
        text: `Analiza los discos del lado ${side === "left" ? "IZQUIERDO" : "DERECHO"} de la barra. Resultado en ${unit}.

La barra está orientada ${location.orientation === "vertical" ? "VERTICALMENTE" : "HORIZONTALMENTE"}.
Se estiman aproximadamente ${location.estimated_disc_count} discos en este lado.

IMPORTANTE:
- SOLO cuenta discos INSERTADOS en la barra. IGNORA discos en el piso o alrededores.
- Busca ESPECIALMENTE discos pequeños (change plates) entre los bumper grandes y el collarín.
- El collarín/clip NO es un disco.

Responde solo JSON.`,
      },
    ]);

    console.log("Pass 2 result:", JSON.stringify(analysis));

    // ══ Construir resultado final ══
    const plates = analysis.plates ?? [];
    const sideTotal = analysis.side_total ?? plates.reduce((sum: number, p: any) => sum + p.weight, 0);

    // Asumir simetría: ambos lados iguales
    const totalWeight = barWeight + (sideTotal * 2);

    // Transformar a formato discs para la app
    const discMap = new Map<string, { color: string; weight: number; quantity: number; side: string }>();
    for (const plate of plates) {
      const key = `${plate.color}-${plate.weight}`;
      const existing = discMap.get(key);
      if (existing) {
        existing.quantity += 1;
      } else {
        discMap.set(key, {
          color: plate.color,
          weight: plate.weight,
          quantity: 1,
          side: "both", // asumimos simetría
        });
      }
    }

    const result = {
      reasoning: analysis.reasoning ?? "",
      bar: { type: barType, weight: barWeight },
      discs: Array.from(discMap.values()),
      totalWeight,
      confidence: analysis.confidence ?? 0.7,
      unit,
      notes: `Análisis de dos pasadas. Lado analizado: ${side}. Simetría asumida.`,
    };

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
