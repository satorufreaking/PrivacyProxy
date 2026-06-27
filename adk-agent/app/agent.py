# ruff: noqa
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
from zoneinfo import ZoneInfo

from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

import os
import google.auth

use_vertex = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "False") == "True"
project_id = "mock-project"

if use_vertex:
    try:
        _, project_id = google.auth.default()
    except Exception:
        pass

os.environ["GOOGLE_CLOUD_PROJECT"] = project_id or "mock-project"
os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "False"


import httpx

def redact_sensitive_text(text: str) -> str:
    """Deterministic PII Redaction tool. Clears sensitive names, emails, phones, CCs, Govt IDs, IPs, and physical addresses from text.
    
    Args:
        text: The raw text containing potential sensitive PII data to redact.
        
    Returns:
        The sanitized/anonymized text with placeholders.
    """
    try:
        response = httpx.post(
            "http://localhost:3000/api/proxy/process",
            json={
                "text": text,
                "rules": [],
                "customWords": ["Acme", "ProjectX"],
                "task": "sanitize-only"
            },
            timeout=10.0
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("sanitizedText", text)
        return f"Error from Privacy Proxy: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Failed to connect to Privacy Proxy: {str(e)}"


root_agent = Agent(
    name="root_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="You are a secure, high-integrity AI assistant operating behind a Secure Redaction Proxy. When given text containing sensitive PII (like names, emails, or phone numbers), you MUST use the redact_sensitive_text tool to scrub the text before processing or summarizing it.",
    tools=[redact_sensitive_text],
)

app = App(
    root_agent=root_agent,
    name="app",
)
