import os
import re
import base64
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from mistralai.client.sdk import Mistral
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20MB max

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif", "bmp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def encode_image(image_bytes: bytes, mime_type: str) -> str:
    return base64.standard_b64encode(image_bytes).decode("utf-8")

def extract_content_from_image(image_bytes: bytes, mime_type: str) -> dict:
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("MISTRAL_API_KEY no configurada en .env")

    client = Mistral(api_key=api_key)
    b64 = encode_image(image_bytes, mime_type)

    prompt = """Analiza esta imagen de apuntes de clase y extrae TODO el contenido de forma estructurada.

Devuelve un JSON con exactamente esta estructura:
{
  "titulo": "título o tema principal si lo hay, sino null",
  "texto_principal": "todo el texto corrido, párrafos y explicaciones",
  "formulas": [
    {"descripcion": "nombre o contexto de la fórmula", "latex": "fórmula en LaTeX", "texto_plano": "fórmula en texto plano"}
  ],
  "listas": [
    {"tipo": "numerada o viñetas", "items": ["item1", "item2"]}
  ],
  "diagramas_figuras": [
    {"descripcion": "descripción detallada del diagrama o figura"}
  ],
  "definiciones": [
    {"termino": "término", "definicion": "definición"}
  ],
  "observaciones": "notas adicionales, subrayados importantes, anotaciones al margen"
}

Reglas:
- Si no hay contenido de un tipo, usa lista vacía [] o null
- Las fórmulas matemáticas SIEMPRE en LaTeX válido
- Transcribe TODO el texto visible, incluyendo texto pequeño y anotaciones
- Para diagramas, describe lo que representan con detalle
- Responde ÚNICAMENTE con el JSON, sin markdown ni explicaciones extra"""

    response = client.chat.complete(
        model="pixtral-12b-2409",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": f"data:{mime_type};base64,{b64}",
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
    )

    raw = response.choices[0].message.content.strip()
    # Limpiar si viene envuelto en markdown
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    # Eliminar caracteres de control inválidos en JSON (excepto \n \r \t)
    raw = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', raw)

    return json.loads(raw, strict=False)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/extract", methods=["POST"])
def extract():
    if "files" not in request.files:
        return jsonify({"error": "No se recibieron archivos"}), 400

    files = request.files.getlist("files")
    results = []

    for file in files:
        if not file or not file.filename:
            continue
        if not allowed_file(file.filename):
            results.append({
                "filename": file.filename,
                "error": "Formato no soportado. Usa PNG, JPG, WEBP."
            })
            continue

        ext = file.filename.rsplit(".", 1)[1].lower()
        mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                    "webp": "image/webp", "gif": "image/gif", "bmp": "image/bmp"}
        mime_type = mime_map.get(ext, "image/jpeg")

        image_bytes = file.read()
        b64_preview = base64.standard_b64encode(image_bytes).decode("utf-8")

        try:
            content = extract_content_from_image(image_bytes, mime_type)
            results.append({
                "filename": file.filename,
                "preview": f"data:{mime_type};base64,{b64_preview}",
                "content": content,
                "error": None
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "preview": f"data:{mime_type};base64,{b64_preview}",
                "error": str(e),
                "content": None
            })

    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
