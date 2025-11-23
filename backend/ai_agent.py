import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models
import json
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = self._get_api_key()
        self.system_prompt_template = self._get_system_prompt_template()
        
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            logger.warning("Gemini API Key not found in configuration.")
            self.client = None

    def _get_api_key(self) -> str:
        config = self.db.query(models.AgentConfig).filter(models.AgentConfig.key == "gemini_api_key").first()
        return config.value if config else None

    def _get_system_prompt_template(self) -> str:
        config = self.db.query(models.AgentConfig).filter(models.AgentConfig.key == "system_instructions").first()
        # Default prompt if not in DB, but we will construct a specific one for analysis
        return config.value if config else ""

    def get_active_topics(self) -> List[models.InterestTopic]:
        return self.db.query(models.InterestTopic).all()

    def build_analysis_prompt(self, news_items: List[models.NewsItem], topics: List[models.InterestTopic]) -> str:
        topics_str = json.dumps([{
            "id": t.id,
            "subject": t.subject,
            "scope": t.scope,
            "keywords": t.keywords,
            "exclusions": t.exclusions,
            "relevance": t.relevance_level
        } for t in topics], indent=2)

        news_str = json.dumps([{
            "id": item.id,
            "title": item.title,
            "url": item.url,
            "published_date": item.published_date
        } for item in news_items], indent=2)

        prompt = f"""
        You are an AI News Analyst for a strategic news agency. Your task is to analyze the following news items against a set of strategic interest topics.

        **Strategic Topics (The Compass):**
        {topics_str}

        **News Items to Analyze:**
        {news_str}

        **Analysis Protocol (5-Vector Matrix):**
        For EACH news item, calculate a score (0-100) based on these 5 vectors:
        1. **Thematic Alignment (0-20pts):** How well does it match a Topic's scope and keywords?
        2. **Relevance/Impact (0-20pts):** From curiosity (0) to strategic change (20).
        3. **Consequences (0-20pts):** From none (0) to paradigm shift (20).
        4. **Normality (0-20pts):** From routine (5) to unprecedented (20).
        5. **Facticity (0-20pts):** From rumor (0) to confirmed fact (20).

        **CRITICAL RULES:**
        1. **Exclusions:** If a news item contains any "exclusions" keyword defined in a matching Topic, the Total Score MUST be 0.
        2. **Output Format:** You must return a STRICT JSON list of objects. Do not include markdown formatting (like ```json).
        3. **Explanation:** Provide a concise explanation (max 2 sentences) justifying the score, mentioning the matching topic if any.
        4. **Category:** Assign a category: "Irrelevante" (0-29), "Interés General" (30-69), "Alta Prioridad" (70-100).

        **Expected JSON Output Structure:**
        [
            {{
                "news_id": 123,
                "ai_score": 85,
                "ai_category": "Alta Prioridad",
                "ai_explanation": "Matches topic 'Elections' with high impact due to..."
            }},
            ...
        ]
        """
        return prompt

    def analyze_batch(self, news_items: List[models.NewsItem]) -> int:
        if not self.client:
            logger.error("AI Client not initialized (missing API Key).")
            return 0

        if not news_items:
            return 0

        topics = self.get_active_topics()
        if not topics:
            logger.warning("No active topics found for analysis.")
            return 0

        prompt = self.build_analysis_prompt(news_items, topics)
        
        try:
            response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            response_text = response.text
            
            # Clean response if it contains markdown
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            results = json.loads(response_text)
            
            analyzed_count = 0
            for result in results:
                news_id = result.get("news_id")
                score = result.get("ai_score")
                category = result.get("ai_category")
                explanation = result.get("ai_explanation")

                if news_id is not None:
                    # Find the item in the list (avoiding DB query for each if possible, but safe to query DB to attach to session)
                    item = next((i for i in news_items if i.id == news_id), None)
                    if item:
                        item.ai_score = score
                        item.ai_category = category
                        item.ai_explanation = explanation
                        analyzed_count += 1
            
            self.db.commit()
            return analyzed_count

        except Exception as e:
            logger.error(f"Error during AI analysis: {e}")
            return 0
