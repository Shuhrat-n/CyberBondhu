# CyberBondhu handoff
- Game_Scenarios.json: 15 training items, server-side bilingual seed records.
- Assessment_Scenarios.json: 5 pre + 5 post items, exclude from training.
- Dataset_Sources.csv: provenance of training messages, adapted text in both languages.
- API_Preview_en/bn.json: examples of localized start responses (all 15; select 5 on server). No answer keys included.
- Game_Scenarios_Staging.sql: optional MySQL 8 staging inserts, not existing backend schema. Import into a test DB only; rerunning will produce duplicate key errors. JSON is preferred until entity definitions are known.
- Research_and_Evaluation.docx / .md: research and proposed evaluation.
- Evaluation_Log_Template.csv: blank data collection template; no fabricated results.

## API handoff
GET /api/game/start?lang=en&limit=5 should select five training records and return [{id,title,message,choices:[{id,text}]}]. Select localized values using lang=en or bn. Never return safe/feedback or correct answer before submission. POST /api/game/submit?lang=en accepts {scenarioId,choiceId}; server verifies the choice belongs to the scenario and returns {safe,feedback,correctChoiceText} in the chosen language. Persist per-user attempts with session/round identifiers, authenticated user identity and timestamp. The current frontend hard-codes lang=en; teammate must add language selection and replace both hard-coded values. The existing backend schema and progress endpoint implementation were not supplied, so no production integration or live tests are claimed. Use three distinct five-item rounds for the study, not uncontrolled random repeats. Pre/post must be separate assessment modes with feedback withheld; current frontend always displays feedback, so use an offline form or implement assessment mode. Do not bundle answer-key JSON into public static assets.

## QA and outstanding work
JSON parsed and validated for unique scenario/choice IDs, exactly three choices and one safe choice, complete bilingual fields. No live links in messages. Actual raw Mendeley files not retrieved; dataset-preview provenance is explicitly documented. Independent bilingual reviewer, raw corpus audit, production database mapping and faculty-approved user evaluation remain pending. No measured results are claimed.
