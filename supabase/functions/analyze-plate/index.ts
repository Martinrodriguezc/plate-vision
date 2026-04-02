import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

// ============================================================
// PROMPT v3 — Fixes específicos:
//
// FIX 1: SIMETRÍA FORZADA
//   Antes: "si no se ve bien, asume simétrico" (condicional)
//   Ahora: "SIEMPRE analiza UN solo lado y duplica. NUNCA
//           analices ambos lados por separado."
//   Razón: en gym real el 99% de las veces es simétrico,
//   y cuando el modelo intenta ver ambos lados, alucina
//   en el lado tapado por el rack.
//
// FIX 2: DISCOS CHICOS — HONESTIDAD SOBRE INCERTIDUMBRE
//   Antes: el modelo o los ignoraba o los inventaba.
//   Ahora: paso explícito de "¿hay franjas delgadas entre
//   los discos grandes?" + campo "possible_hidden_plates"
//   para que la app muestre confirmación al usuario.
//
// FIX 3: MARCAS COMERCIALES (ILUS, ROGUE, ELEIKO, etc.)
//   Los colores de marcas comerciales NO siempre siguen
//   el estándar olímpico. El prompt ahora prioriza:
//   1. Número impreso en el disco (máxima prioridad)
//   2. Diámetro relativo entre discos
//   3. Color (solo como referencia, NO como verdad)
//
// FIX 4: DISTRACTORES
//   Refuerzo más agresivo de ignorar discos fuera de la barra.
// ============================================================

const SYSTEM_PROMPT = `Eres un sistema de visión para identificar discos en barras de gimnasio.

═══ CÓMO IDENTIFICAR DISCOS (en orden de prioridad) ═══

1. NÚMERO IMPRESO en el disco → usa ese peso. Máxima prioridad.
2. DIÁMETRO RELATIVO entre discos → el más grande = más pesado.
3. GROSOR del disco visto de perfil → más grueso = más pesado.
4. COLOR → solo como pista adicional, NO como verdad absoluta.
   Muchas marcas (ILUS, Rogue, etc.) usan colores no estándar.

Referencia de colores SOLO para discos olímpicos IWF certificados:
Rojo=25kg | Azul=20kg | Amarillo=15kg | Verde=10kg | Blanco=5kg

BARRAS: Olímpica=20kg | Femenina=15kg | Estándar=10kg | EZ=8kg

═══ REGLA DE SIMETRÍA (OBLIGATORIA) ═══

SIEMPRE analiza UN SOLO LADO de la barra (el que mejor se vea) y DUPLICA los discos para el otro lado. NUNCA intentes analizar ambos lados por separado. En el gimnasio, la carga es simétrica el 99% de las veces, y el lado tapado por el rack te va a hacer alucinar.

═══ REGLA DE DISTRACTORES (OBLIGATORIA) ═══

SOLO cuenta discos que estén INSERTADOS EN LA MANGA de la barra (atravesados por ella). IGNORA TODO disco que esté:
- En el piso (apoyado, rodando, o contra algo)
- En racks de almacenamiento
- Contra paredes o bancos
- En manos de alguien
Antes de contar un disco, pregúntate: ¿la barra lo atraviesa? Si no → ignorar.

═══ PROCESO (sigue estos pasos exactos en "reasoning") ═══

PASO 1 — ESCENA: Describe brevemente qué ves (tipo de rack, ángulo, qué lado se ve mejor). Menciona explícitamente cualquier disco que esté fuera de la barra para dejarlo descartado.

PASO 2 — BARRA: Identifica tipo y peso.

PASO 3 — LADO VISIBLE (de AFUERA hacia ADENTRO): Para cada disco describe:
  - Qué ves: color, tamaño relativo, grosor, número impreso si hay
  - Peso asignado y por qué
  - Confianza

PASO 4 — DISCOS CHICOS: ¿Hay franjas delgadas entre los discos grandes o en los extremos? Los discos de 1.25kg, 2.5kg y 5kg son muy delgados y fáciles de perder. Si sospechas que hay alguno pero no estás seguro, repórtalo en "possible_hidden_plates".

PASO 5 — SUMA: barra(X) + 2 × (A+B+C+...) = total
(multiplicar por 2 porque duplicas el lado visible)

═══ FORMATO JSON ═══

{
  "reasoning": "PASO 1: ... PASO 2: ... PASO 3: ... PASO 4: ... PASO 5: ...",
  "bar": {"type": "string", "weight": number},
  "plates_one_side": [
    {"index": number, "color": "string", "weight": number, "identified_by": "number_printed"|"diameter"|"thickness"|"color", "confidence": number}
  ],
  "possible_hidden_plates": [
    {"weight": number, "reason": "string"}
  ],
  "totalWeight": number,
  "confidence": number,
  "unit": "kg",
  "notes": "string"
}

REGLAS DEL JSON:
- "plates_one_side" = discos de UN solo lado (el visible). La app duplica.
- "index": 1=más externo hacia adentro.
- "identified_by": cómo determinaste el peso (prioridad: number_printed > diameter > thickness > color).
- "possible_hidden_plates": discos que SOSPECHAS pero no confirmas. Puede estar vacío [].
- "totalWeight" = bar.weight + 2 × suma(plates_one_side). NO incluyas possible_hidden_plates en el total.
- Si no es barra: {"error":"no_barbell"}
- Si imagen borrosa: {"error":"low_quality"}`;

function buildUserMessage(unit: string): string {
  return `Analiza esta barra de pesas. Unidad: ${unit}.

Recuerda:
- Analiza UN SOLO LADO (el más visible) y duplica
- Prioriza números impresos > diámetro > grosor > color
- Si ves franjas delgadas sospechosas, repórtalas en possible_hidden_plates
- IGNORA todo disco que no esté insertado en la barra

Responde SOLO con JSON válido.`;
}

// ============================================================
// VALIDACIÓN POST-MODELO (actualizada para nuevo formato)
// ============================================================

const VALID_PLATE_WEIGHTS_KG = [0.5, 1, 1.25, 2.5, 5, 10, 15, 20, 25];
const VALID_PLATE_WEIGHTS_LBS = [2.5, 5, 10, 15, 25, 35, 45, 55];

interface PlateOneSide {
  index: number;
  color: string;
  weight: number;
  identified_by: string;
  confidence: number;
}

interface PossibleHiddenPlate {
  weight: number;
  reason: string;
}

interface AnalysisResult {
  reasoning?: string;
  bar?: { type: string; weight: number };
  plates_one_side?: PlateOneSide[];
  possible_hidden_plates?: PossibleHiddenPlate[];
  totalWeight?: number;
  confidence?: number;
  unit?: string;
  notes?: string;
  error?: string;
  message?: string;
  // Campos transformados para la app
  plates?: { position: string; index: number; color: string; weight: number; confidence: number }[];
  discs?: { color: string; weight: number; quantity: number; side: string }[];
  warnings?: string[];
  needs_confirmation?: PossibleHiddenPlate[];
}

function validateAndFix(result: AnalysisResult): AnalysisResult {
  if (result.error) return result;
  if (!result.plates_one_side || !result.bar) return result;

  const warnings: string[] = [];
  const unit = result.unit ?? "kg";
  const validWeights =
    unit === "lbs" ? VALID_PLATE_WEIGHTS_LBS : VALID_PLATE_WEIGHTS_KG;

  // 1. Corregir pesos no estándar
  for (const plate of result.plates_one_side) {
    if (!validWeights.includes(plate.weight)) {
      const closest = validWeights.reduce((prev, curr) =>
        Math.abs(curr - plate.weight) < Math.abs(prev - plate.weight)
          ? curr
          : prev
      );
      warnings.push(
        `Disco #${plate.index}: ${plate.weight}${unit} no es estándar → corregido a ${closest}${unit}`
      );
      plate.weight = closest;
      plate.confidence = Math.min(plate.confidence, 0.5);
    }
  }

  // 2. Recalcular peso total (simetría forzada: × 2)
  const oneSideTotal = result.plates_one_side.reduce(
    (s, p) => s + p.weight,
    0
  );
  const correctTotal = result.bar.weight + 2 * oneSideTotal;

  if (result.totalWeight !== correctTotal) {
    warnings.push(
      `Total corregido: modelo dijo ${result.totalWeight}${unit}, calculado=${correctTotal}${unit}`
    );
    result.totalWeight = correctTotal;
  }

  // 3. Expandir plates_one_side → plates (ambos lados) para compatibilidad
  const fullPlates: {
    position: string;
    index: number;
    color: string;
    weight: number;
    confidence: number;
  }[] = [];

  for (const plate of result.plates_one_side) {
    fullPlates.push({
      position: "left",
      index: plate.index,
      color: plate.color,
      weight: plate.weight,
      confidence: plate.confidence,
    });
    fullPlates.push({
      position: "right",
      index: plate.index,
      color: plate.color,
      weight: plate.weight,
      confidence: plate.confidence,
    });
  }

  result.plates = fullPlates;

  // 4. Pasar possible_hidden_plates a la app para confirmación
  if (
    result.possible_hidden_plates &&
    result.possible_hidden_plates.length > 0
  ) {
    result.needs_confirmation = result.possible_hidden_plates;
  }

  // 5. Verificar orden de discos (pesados adentro, livianos afuera)
  const sortedByIndex = [...result.plates_one_side].sort(
    (a, b) => a.index - b.index
  );
  for (let i = 1; i < sortedByIndex.length; i++) {
    if (sortedByIndex[i].weight > sortedByIndex[i - 1].weight) {
      warnings.push(
        `Disco externo #${sortedByIndex[i].index} (${sortedByIndex[i].weight}${unit}) es más pesado que #${sortedByIndex[i - 1].index} (${sortedByIndex[i - 1].weight}${unit}) — poco común`
      );
      break;
    }
  }

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}

// ============================================================
// TRANSFORMAR plates → discs (formato que espera tu app)
// ============================================================

function transformToDiscs(result: AnalysisResult): AnalysisResult {
  if (!result.plates) return result;

  const discMap = new Map<
    string,
    { color: string; weight: number; quantity: number; side: string }
  >();

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

  return result;
}

// ============================================================
// EDGE FUNCTION
// ============================================================

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
        max_tokens: 1024,
        temperature: 0.1,
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
                text: buildUserMessage(unit),
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
    console.log("Claude response:", content);

    let result: AnalysisResult;
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

    // Validar, corregir, y transformar
    result = validateAndFix(result);
    result = transformToDiscs(result);

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
