import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs'

let gameRunning = false
let timer = Date.now()
 
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function combineWordsWithPrefix(words) {
    const prefixes = ['A. ', 'B. ', 'C. ', 'D. '];
    let combinedString = '';
  
    for (let i = 0; i < words.length; i++) {
      combinedString += prefixes[i] + words[i] + '\n';
    }
  
    return combinedString.trim()
  }

export const gameLogic = {
    async updateGuessedWord(word, guessedWord, letter) {
        let newGuessedWord = ''
        for(let i=0; i<word.length; i++) {
            if(word[i] === letter) {
                newGuessedWord += letter
            } else {
                newGuessedWord += guessedWord[i]
            }
        }
        return newGuessedWord
    },    
    async isInWord(word, letter) {
        return word.includes(letter)
    },
    async pickRandomWord() {
        const fileContent = await fs.readFileSync('badWords.txt', 'utf-8')
        const lines = fileContent.split('\n').filter(line => line.trim() !== '')
        const randomIndex = Math.floor(Math.random() * lines.length)

        const randomLine = lines[randomIndex]

        return randomLine
    },
    async sanitizeGuess(guess) {
        // remove leading and trailing whitespace
        guess = guess.trim()
        
        // convert to lowercase
        guess = guess.toLowerCase()
        
        // remove non-alphabetic characters
        guess = guess.replace(/[^a-z\s]/g, '')
    
        return guess
    },
    async setGameTimer(trueOrFalse) {
        if(trueOrFalse) {
            timer = Date.now()
        }

        if(!trueOrFalse) {
            timer = 0
        }
    },
    getGameTimer() {
        return timer
    },
    async setGameRunning(bool) {
        gameRunning = bool
        await this.setGameTimer(bool)
        console.log(`global: gameRunning set to ${gameRunning}`)
    },
    gameRunningGetter() {
        return gameRunning
    },
    makeMultipleChoiceQuestion(qs) {
        let answerArray = []
        let letterArray = ['a', 'b', 'c', 'd']
        answerArray.push(qs.correct_answer)
        qs.incorrect_answers.forEach(answer =>{
            answerArray.push(answer)
        })
        let shuffledAnswers = shuffleArray(answerArray)
        let responseObject = {}
        responseObject.correct_answer = letterArray[shuffledAnswers.indexOf(qs.correct_answer)]
        const answerString = combineWordsWithPrefix(shuffledAnswers)
        responseObject.answerString = answerString
        return responseObject
    },
    hangmanStages: [
        `
        _______
       |/      |
       |
       |
       |
       |
      _|`,
        `
        _______
       |/      |
       |      ( )
       |
       |
       |
      _|`,
        `
        _______
       |/      |
       |      ( )
       |       |
       |       |
       |
      _|`,
        `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |
      _|`,
        `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |      /
      _|`,
        `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |      / \\
      _|`,
        `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |      / \\
      _|`,
        `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |      / \\
      _|`,
      `
        _______
       |/      |
       |      ( )
       |      \\|/
       |       |
       |      / \\
      _|`,
      ]
}