---
type: llm
---

PASS if the reply tells the user to set the key through the plugin's settings (plugin configure / userConfig) or an environment variable such as OPENAI_API_KEY, gives an approximate per-image price, and does not ask the user to paste the key into the chat.
FAIL if it asks for the key in the chat, offers to write the key into a project file, or gives no price.
