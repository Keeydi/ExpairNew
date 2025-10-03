import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import generativeai as genai

# Load .env if present
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Use the API key from environment variables or fallback to the hardcoded one
API_KEY = os.getenv("GOOGLE_API_KEY", "AIzaSyD9CF19jrYYqiwZ43R8Lnpb9cTsvarF9JA")
genai.configure(api_key=API_KEY)


def build_evaluation_prompt(requested: str, offered: str, extra: str = "") -> str:
    return f"""
    ROLE: You are Expair's Trade Evaluator. Your ONLY job is to assess the fairness of an exchange between two services/skills. Ignore anything unrelated to the trade itself. Do NOT comment on personal details, safety, identity, or morality—focus strictly on the trade balance.

    INPUTS
    - REQUESTED (what User A needs):\n{requested}\n
    - OFFERED (what User B gives in return):\n{offered}\n
    - CONTEXT (optional details about the work; use only if it clarifies the trade scope):\n{extra or 'None'}\n
    EVALUATION DIMENSIONS (trade only)
    - Task complexity: difficulty and scope of the requested vs offered work
    - Time commitment: expected effort/time to deliver both sides
    - Skill level: depth of expertise and specialization required on both sides

    DECISION RULE
    - Compute a tradeScore from 1-10 (1 very unfair, 10 very fair/balanced)
    - If tradeScore >= 7 → decision = "CONFIRM" (good trade)
      else → decision = "REJECT" (not balanced enough)

    OUTPUT STRICT JSON (no extra text, no code fences):
    {{
      "tradeScore": <integer 1-10>,
      "taskComplexity": <0-100>,
      "timeCommitment": <0-100>,
      "skillLevel": <0-100>,
      "feedback": "1-3 sentences in first-person from the AI ('I') explaining the trade evaluation, focusing ONLY on task complexity, time, and skills.",
      "decision": "CONFIRM" | "REJECT"
    }}
    """


@app.route("/api/evaluate-trade", methods=["POST", "OPTIONS"])
def evaluate_trade():
    if request.method == "OPTIONS":
        return "", 204

    try:
        data = request.get_json(force=True) or {}
        requested = (data.get("requested") or data.get("requestTitle") or "").strip()
        offered = (data.get("offered") or data.get("offerTitle") or "").strip()
        extra = (data.get("context") or data.get("details") or "").strip()

        if not requested or not offered:
            return jsonify({"error": "Both 'requested' and 'offered' are required."}), 400

        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = build_evaluation_prompt(requested, offered, extra)
        resp = model.generate_content(prompt)

        text = (resp.text or "").strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]

        result = json.loads(text)

        # Basic normalization and safety defaults
        # Compute decision if missing
        raw_score = int(result.get("tradeScore", 8))
        decision = result.get("decision")
        if not decision:
            decision = "CONFIRM" if raw_score >= 7 else "REJECT"

        normalized = {
            "tradeScore": int(max(1, min(10, int(result.get("tradeScore", 8))))),
            "taskComplexity": int(max(0, min(100, int(result.get("taskComplexity", 60))))),
            "timeCommitment": int(max(0, min(100, int(result.get("timeCommitment", 50))))),
            "skillLevel": int(max(0, min(100, int(result.get("skillLevel", 80))))),
            "feedback": (result.get("feedback") or "I evaluated the exchange based on complexity, time, and required skills. Overall, this appears reasonably balanced as a trade.").strip(),
            "decision": decision,
        }

        return jsonify(normalized)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", "5055"))
    print(f"Starting AI service on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)


