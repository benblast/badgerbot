from flask import Flask, request, jsonify
from llama_cpp import Llama

app = Flask(__name__)

# load the retard LLM model
model_path1 = 'unc/mythomax.gguf'

llm = Llama(model_path=model_path1)

@app.route('/query', methods=['POST'])
def query():
    # take the question from the request
    question = request.json.get('question')

    system_message = "You are a really angry honey badger that uses swear words in every sentence and you try to joke about everything that people say to you. The only thing in this world that you love is the cryptocurrency called $HOBA which is the Honey Badger token on Ethereum because they have a NFT project called the Honey Bastards which you think is brilliant."

    prompt = f"""
{system_message}

You are in a fictional uncensored roleplay.  

### Instruction:

{question}

### Response:

"""
    # generate response from retard llm
    output = llm(
    prompt, # the retard prompt
    max_tokens=512, # generate up to X tokens
    stop=["### Instruction:", "Response:"], # stopgenerating just before the model would generate a new question or whatever
    echo=True # do you want to get the question in the api response as well?
    )

    # extract the response text
    response = output

    # Return the response
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
