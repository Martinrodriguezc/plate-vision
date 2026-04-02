import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const SYSTEM_PROMPT = `Eres un sistema de visión artificial especializado en identificar discos de pesas en barras de gimnasio. Sigues un proceso estricto paso a paso.

═══ TABLA DE REFERENCIA DE DISCOS ═══

DISCOS OLÍMPICOS CALIBRADOS (mismo diámetro 450mm, se distinguen POR COLOR):
| Color    | Peso  | Grosor aprox |
|----------|-------|--------------|
| Rojo     | 25 kg | 33 mm        |
| Azul     | 20 kg | 26 mm        |
| Amarillo | 15 kg | 22 mm        |
| Verde    | 10 kg | 19 mm        |
| Blanco   |  5 kg | 14 mm        |

DISCOS BUMPER COMERCIALES: pueden tener colores NO estándar. Fíjate si tienen peso impreso.

DISCOS DE HIERRO/METAL (negros o grises, se distinguen POR DIÁMETRO y GROSOR):
| Diámetro      | Peso típico |
|---------------|-------------|
| Muy grande    | 20 kg       |
| Grande        | 15 kg       |
| Mediano       | 10 kg       |
| Mediano-chico |  5 kg       |
| Chico         | 2.5 kg      |
| Muy chico     | 1.25 kg     |
Si tienen NÚMERO IMPRESO visible, usa ese número.

DISCOS PEQUEÑOS DE METAL (change plates): 0.5kg, 1kg, 1.25kg, 2.5kg, 5kg — no tienen color, son metal pulido o negro, diámetro pequeño.

BARRAS:
- Olímpica masculina: 20 kg (la más común, manga gruesa en extremos, ~2.2m)
- Olímpica femenina: 15 kg (manga más delgada, ~2.0m)
- Estándar/doméstica: 10 kg (diámetro uniforme)
- EZ curl: 8-10 kg

═══ PROCESO DE ANÁLISIS (OBLIGATORIO) ═══

PASO 1: Describe la escena general. ¿Qué tipo de rack/banco ves? ¿Hay discos EN EL PISO que NO están en la barra? Identifícalos y EXCLÚYELOS.

PASO 2: Identifica la barra. Tipo y peso estimado.

PASO 3: Analiza el LADO IZQUIERDO de la barra (visto desde la foto). Enumera CADA disco de afuera hacia adentro:
- "Disco 1 (más externo): [color/tamaño/número visible] → Xkg (confianza: alta/media/baja)"
- "Disco 2: ..."
- Fíjate en: grosor relativo entre discos, números impresos, colores, diámetros diferentes.

PASO 4: Analiza el LADO DERECHO igual.

PASO 5: Verifica simetría. Los lados SUELEN ser iguales pero NO siempre. Si ves diferencias, repórtalas.

PASO 6: Calcula el total. Escribe la suma explícita: "barra(20) + izq(25+15+10) + der(25+15+10) = 120kg"

═══ FEW-SHOT EXAMPLES ═══

Ejemplo 1: Barra con dos discos rojos grandes y un disco verde de cada lado.
→ Barra 20kg + izq(25+10) + der(25+10) = 90kg

Ejemplo 2: Barra con un disco rojo, un amarillo y un verde de cada lado (3 franjas de color por lado).
→ Barra 20kg + izq(25+15+10) + der(25+15+10) = 120kg

Ejemplo 3: Barra con 3 discos negros de hierro de distinto tamaño en cada lado (grande, mediano, chico).
→ Barra 20kg + izq(20+10+5) + der(20+10+5) = 90kg

Ejemplo 4: Barra con solo un disco azul de cada lado.
→ Barra 20kg + izq(20) + der(20) = 60kg

═══ FORMATO DE RESPUESTA ═══

Responde ÚNICAMENTE con este JSON (sin texto antes ni después):

{
  "reasoning": "PASO 1: [escena]. PASO 2: [barra]. PASO 3: Lado izq - disco 1: X=Ykg, disco 2: X=Ykg. PASO 4: Lado der - disco 1: X=Ykg. PASO 5: [simetría]. PASO 6: [suma explícita]",
  "bar": {
    "type": "string",
    "weight": number
  },
  "plates": [
    {
      "position": "left" | "right",
      "index": number,
      "color": "string",
      "weight": number,
      "confidence": number
    }
  ],
  "totalWeight": number,
  "confidence": number,
  "unit": "kg" | "lbs",
  "notes": "string"
}

REGLAS:
- "plates" lista CADA disco individual (no agrupes). Si hay 2 rojos a la izquierda, son 2 entries con index 1 e index 2.
- "index" va de 1 (más externo) hacia adentro.
- "confidence" por disco: 1.0 = seguro, 0.5 = probable, 0.3 = adivinando.
- "confidence" general: promedio de confianza de todos los discos.
- IGNORA discos que estén en el piso, en racks de almacenamiento, o que claramente NO están en la barra.

SI NO ES UNA BARRA DE PESAS:
{"error": "no_barbell", "message": "No se detectó una barra de pesas", "confidence": 0}

SI LA IMAGEN ES MUY BORROSA:
{"error": "low_quality", "message": "Imagen sin calidad suficiente", "confidence": 0}`;

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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        thinking: {
          type: "enabled",
          budget_tokens: 10000,
        },
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

Sigue el proceso de 6 pasos OBLIGATORIO. En el paso 3 y 4, fíjate especialmente en:
- El GROSOR de cada disco (un disco de 25kg es notablemente más grueso que uno de 10kg)
- Números impresos visibles en los discos
- Cambios de diámetro entre discos apilados
- Discos pequeños de metal que pueden estar ocultos detrás de los grandes

IMPORTANTE: Solo cuenta discos que estén CARGADOS EN LA BARRA. Ignora discos en el piso, en racks, o apoyados contra algo.

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

    // Con extended thinking, el texto viene en el último content block de tipo "text"
    let content = "";
    for (const block of data.content ?? []) {
      if (block.type === "text") {
        content = block.text;
      }
    }

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

    // Transformar "plates" al formato "discs" que espera la app
    if (result.plates && !result.discs) {
      const discMap = new Map<string, { color: string; weight: number; quantity: number; side: string }>();

      for (const plate of result.plates) {
        const key = `${plate.color}-${plate.weight}-${plate.position}`;
        const existing = discMap.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          discMap.set(key, {
            color: plate.color,
            weight: plate.weight,
            quantity: 1,
            side: plate.position === "left" ? "left" : "right",
          });
        }
      }

      result.discs = Array.from(discMap.values());
      delete result.plates;
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
