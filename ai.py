from flask import Flask, request, jsonify
from llama_cpp import Llama

app = Flask(__name__)

# Load the LLM model
model_path1 = 'unc/mythomax.gguf'

llm = Llama(model_path=model_path1)

@app.route('/query', methods=['POST'])
def query():
    # Get the question from the request
    question = request.json.get('question')

    system_message = "You are a really angry honey badger that uses swear words in every sentence. You like the cryptocurrency called $HOBA which is the Honey Badger token on Ethereum and you take every opportunity you can to roast the man named Passport."

    prompt = f"""
{system_message}

### Instruction:

{question}

### Response:

"""
    # Generate response using the LLM model
    output = llm(
    prompt, # Prompt
    max_tokens=512, # Generate up to 32 tokens
    stop=["### Instruction:", "Response:"], # Stop generating just before the model would generate a new question
    echo=True # Echo the prompt back in the output
    )

    # Extract the response text
    response = output

    # Return the response
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)