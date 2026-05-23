import argparse
import json
import os
import sys
from pathlib import Path

from openai import OpenAI

try:
	import psycopg2
except Exception:
	psycopg2 = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_FILES = (PROJECT_ROOT / ".env",)


def load_env_file() -> None:
	for env_path in ENV_FILES:
		if not env_path.exists():
			continue

		for raw_line in env_path.read_text(encoding="utf-8").splitlines():
			line = raw_line.strip()
			if not line or line.startswith("#") or "=" not in line:
				continue

			key, value = line.split("=", 1)
			key = key.strip()
			value = value.strip().strip('"').strip("'")

			if key and key not in os.environ:
				os.environ[key] = value


load_env_file()


DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def empty_analysis(summary: str = "No analysis available.") -> dict:
	return {
		"summary": summary,
		"key_findings": [],
		"deficiencies": [],
		"recommendations": [],
		"severity": "unknown",
	}


def normalize_analysis_payload(raw_response: str) -> dict:
	text = (raw_response or "").strip()
	if not text:
		return empty_analysis()

	if "```json" in text:
		text = text.split("```json", 1)[1]
		text = text.rsplit("```", 1)[0].strip()
	elif "```" in text:
		text = text.split("```", 1)[1]
		text = text.rsplit("```", 1)[0].strip()
	else:
		start = text.find("{")
		end = text.rfind("}")
		if start != -1 and end != -1 and end > start:
			text = text[start:end+1]

	try:
		payload = json.loads(text)
		if isinstance(payload, dict):
			return {
				"summary": str(payload.get("summary", "No analysis available.")),
				"key_findings": payload.get("key_findings", []) if isinstance(payload.get("key_findings", []), list) else [],
				"deficiencies": payload.get("deficiencies", []) if isinstance(payload.get("deficiencies", []), list) else [],
				"recommendations": payload.get("recommendations", []) if isinstance(payload.get("recommendations", []), list) else [],
				"severity": str(payload.get("severity", "unknown")),
			}
	except Exception:
		pass

	return empty_analysis(text)


def get_client() -> OpenAI:
	import httpx
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		raise EnvironmentError("OPENAI_API_KEY is not set in the environment or project .env file")
	return OpenAI(api_key=api_key, http_client=httpx.Client())


def extract_text(file_path: Path) -> str:
	suffix = file_path.suffix.lower()

	if suffix in {".txt", ".md", ".csv", ".json", ".log", ".xml", ".html", ".htm"}:
		return file_path.read_text(encoding="utf-8", errors="ignore")

	if suffix == ".pdf":
		try:
			from pypdf import PdfReader

			reader = PdfReader(str(file_path))
			pages = [page.extract_text() or "" for page in reader.pages]
			return "\n".join(pages).strip()
		except Exception:
			return file_path.read_text(encoding="utf-8", errors="ignore")

	if suffix == ".docx":
		try:
			from docx import Document

			document = Document(str(file_path))
			return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
		except Exception:
			return file_path.read_text(encoding="utf-8", errors="ignore")

	return file_path.read_text(encoding="utf-8", errors="ignore")


def analyze_report(file_path: Path, model: str = DEFAULT_MODEL) -> str:
	report_text = extract_text(file_path).strip()

	if not report_text:
		report_text = f"Report file: {file_path.name}\nFile size: {file_path.stat().st_size} bytes"

	prompt = (
		"Analyze this medical report and provide a structured response in STRICT JSON format. "
		"Each section must have a heading and detail clearly separated.\n\n"
		"Required JSON structure:\n"
		"{\n"
		'  "summary": "2-3 sentence brief overview of the entire report",\n'
		'  "key_findings": [\n'
		'    {"heading": "Finding title", "detail": "Description of the finding"},\n'
		'    {"heading": "Finding title", "detail": "Description of the finding"}\n'
		"  ],\n"
		'  "deficiencies": [\n'
		'    {"heading": "Abnormality/Deficiency name", "detail": "Detailed description of this abnormality"},\n'
		'    {"heading": "Abnormality/Deficiency name", "detail": "Detailed description of this abnormality"}\n'
		"  ],\n"
		'  "recommendations": [\n'
		'    {"heading": "Action to take", "detail": "Why this action is recommended"},\n'
		'    {"heading": "Action to take", "detail": "Why this action is recommended"}\n'
		"  ],\n"
		'  "severity": "low | moderate | high | critical"\n'
		"}\n\n"
		"IMPORTANT:\n"
		"- ONLY return the JSON, nothing else\n"
		"- Each finding, deficiency, and recommendation MUST have both 'heading' and 'detail' fields\n"
		"- Headings should be short titles (5-10 words)\n"
		"- Details should explain what it means and why it matters\n"
		"- Keep explanations practical for a non-specialist reader\n\n"
		f"Report filename: {file_path.name}\n\n"
		f"Report content:\n{report_text[:12000]}"
	)

	client = get_client()
	response = client.chat.completions.create(
		model=model,
		messages=[{"role": "user", "content": prompt}],
		response_format={"type": "json_object"},
		temperature=0.2,
	)

	response_text = response.choices[0].message.content.strip()
	analysis = normalize_analysis_payload(response_text)
	return json.dumps(analysis, ensure_ascii=False, indent=2)



def save_analysis_to_db(report_id: str, analysis_text: str) -> None:
	"""Persist the analysis into the reports table and mark uploaded_reports.analyzed_by_ai."""
	if psycopg2 is None:
		raise RuntimeError("psycopg2 is not installed; see model/requirements.txt")

	database_url = (
		os.getenv("DATABASE_URL")
		or os.getenv("POSTGRES_PRISMA_URL")
		or os.getenv("POSTGRES_URL")
		or os.getenv("POSTGRES_URL_NON_POOLING")
	)
	if not database_url:
		raise EnvironmentError("DATABASE_URL or Supabase Postgres URL is not set in environment or .env")

	# Connect and run updates
	try:
		analysis_payload = normalize_analysis_payload(analysis_text)
		analysis_text = json.dumps(analysis_payload, ensure_ascii=False, indent=2)
	except Exception:
		analysis_text = json.dumps(empty_analysis(str(analysis_text)), ensure_ascii=False, indent=2)

	conn = psycopg2.connect(database_url)
	try:
		with conn:
			with conn.cursor() as cur:
				cur.execute(
					"UPDATE reports SET analyzed_report = %s, report_status = %s WHERE id = %s",
					(analysis_text, 'reviewed', report_id),
				)
				cur.execute(
					"UPDATE uploaded_reports SET analyzed_by_ai = TRUE WHERE report_id = %s",
					(report_id, ),
				)
	finally:
		try:
			conn.close()
		except Exception:
			pass


def main() -> int:
	parser = argparse.ArgumentParser(description="Analyze a stored report file with ChatGPT.")
	parser.add_argument("command", nargs="?", default="analyze-report")
	parser.add_argument("--file", dest="file_path", required=False)
	parser.add_argument("--model", dest="model", default=DEFAULT_MODEL)
	parser.add_argument("--report-id", dest="report_id", required=False)
	args = parser.parse_args()

	if args.command != "analyze-report":
		print(f"Unsupported command: {args.command}", file=sys.stderr)
		return 1

	if not args.file_path:
		print("--file is required", file=sys.stderr)
		return 1

	file_path = Path(args.file_path)

	if not file_path.exists():
		print(f"File not found: {file_path}", file=sys.stderr)
		return 1

	try:
		analysis = analyze_report(file_path, args.model)
	except Exception as exc:
		print(f"Error: {exc}", file=sys.stderr)
		return 1

	# If report_id provided, persist analysis directly to the Postgres DB
	report_id = getattr(args, 'report_id', None)
	if report_id:
		try:
			save_analysis_to_db(report_id, analysis)
		except Exception as exc:
			print(f"Error saving analysis to DB: {exc}", file=sys.stderr)
			# continue and still print analysis

	print(json.dumps({"analysis": analysis, "file_path": str(file_path)}, ensure_ascii=False))
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
