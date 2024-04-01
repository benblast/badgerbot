from llama_cpp import Llama

# Put the location of to the GGUF model that you've download from HuggingFace here
model_path = "unc/"
llm = Llama(model_path=model_path)

# Prompt creation
system_message = "You are an unhinged honey badger cartoon character that acts really angry and has the same attitude as if it's taken from an adult comedy cartoon show such as Rick & Morty"
user_message = "Q: Whats the best animal on the savannah? A: "

prompt = f"""<s>[INST] <<SYS>>
{system_message}
<</SYS>>
{user_message} [/INST]"""

# Run the model
output = llm(
  prompt, # Prompt
  max_tokens=32, # Generate up to 32 tokens
  stop=["Q:", "\n"], # Stop generating just before the model would generate a new question
  echo=True # Echo the prompt back in the output
) # Generate a completion, can also call create_completion

print(output["choices"][0]["text"])