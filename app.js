const MAX_QUESTIONS = 20;

let allQuestions = [];
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

const homeScreen = document.getElementById("home-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");

const unitFilter = document.getElementById("unit-filter");
const topicFilter = document.getElementById("topic-filter");
const startBtn = document.getElementById("start-btn");
const homeMessage = document.getElementById("home-message");

const progressEl = document.getElementById("progress");
const scoreDisplayEl = document.getElementById("score-display");
const questionTextEl = document.getElementById("question-text");
const promptTextEl = document.getElementById("prompt-text");
const mcqOptionsEl = document.getElementById("mcq-options");
const textAnswerArea = document.getElementById("text-answer-area");
const textAnswerInput = document.getElementById("text-answer");
const checkBtn = document.getElementById("check-btn");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");

const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

const hintBtn = document.getElementById("hint-btn");
const hintBox = document.getElementById("hint-box");

async function loadCSV() {
  const response = await fetch("exercises.csv");
  const text = await response.text();
  allQuestions = parseCSV(text);
  populateFilters(allQuestions);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSVLine(lines[0]).map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] || "").trim();
    });
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function populateFilters(questions) {
  const units = [...new Set(questions.map(q => q.unit).filter(Boolean))].sort();
  const topics = [...new Set(questions.map(q => q.topic).filter(Boolean))].sort();

  units.forEach(unit => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    unitFilter.appendChild(option);
  });

  topics.forEach(topic => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startQuiz() {
  const selectedUnit = unitFilter.value;
  const selectedTopic = topicFilter.value;

  let filtered = allQuestions.filter(q => {
    const matchesUnit = !selectedUnit || q.unit === selectedUnit;
    const matchesTopic = !selectedTopic || q.topic === selectedTopic;
    return matchesUnit && matchesTopic;
  });

  if (filtered.length === 0) {
    homeMessage.textContent = "No questions match that filter yet.";
    return;
  }

  quizQuestions = shuffleArray(filtered).slice(0, Math.min(MAX_QUESTIONS, filtered.length));
  currentIndex = 0;
  score = 0;
  answered = false;

  homeMessage.textContent = "";
  homeScreen.classList.add("hidden");
  resultsScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  renderQuestion();
}

function renderQuestion() {
  answered = false;
  feedbackEl.textContent = "";
feedbackEl.textContent = "";
feedbackEl.className = "feedback";
nextBtn.classList.add("hidden");
mcqOptionsEl.innerHTML = "";
textAnswerInput.value = "";
hintBox.textContent = "";
hintBox.classList.add("hidden");
hintBtn.classList.add("hidden");

  const q = quizQuestions[currentIndex];

  if (q.hint && q.hint.trim() !== "") {
  hintBtn.classList.remove("hidden");
}

  progressEl.textContent = `Question ${currentIndex + 1} of ${quizQuestions.length}`;
  scoreDisplayEl.textContent = `Score: ${score}`;
  questionTextEl.textContent = q.question || "";
  promptTextEl.textContent = q.prompt || "";

  if (q.type === "mcq") {
    textAnswerArea.classList.add("hidden");
    mcqOptionsEl.classList.remove("hidden");

    let options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);

// shuffle the options
options = shuffleArray(options);

options.forEach(optionText => {
  const btn = document.createElement("button");
  btn.className = "option-btn";
  btn.textContent = optionText;
  btn.addEventListener("click", () => handleMCQAnswer(optionText));
  mcqOptionsEl.appendChild(btn);
});
  } else if (q.type === "text") {
    mcqOptionsEl.classList.add("hidden");
    textAnswerArea.classList.remove("hidden");
    textAnswerInput.focus();
  }
}

function showHint() {
  const q = quizQuestions[currentIndex];
  if (!q.hint || answered) return;

  hintBox.textContent = `Hint: ${q.hint}`;
  hintBox.classList.remove("hidden");
}

function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[؟?!.,;:]/g, "")
    .replace(/\s+/g, " ");
}

function getValidAnswers(question) {
  const answers = [question.answer];

  if (question.alt_answers) {
    const extras = question.alt_answers
      .split("|")
      .map(a => a.trim())
      .filter(Boolean);
    answers.push(...extras);
  }

  return answers.map(normalizeAnswer);
}

function showFeedback(isCorrect, question) {
  if (isCorrect) {
    feedbackEl.textContent = "Correct!";
    feedbackEl.className = "feedback correct";
  } else {
    let msg = `Incorrect. Correct answer: ${question.answer}`;
    if (question.hint) {
      msg += ` Hint: ${question.hint}`;
    }
    feedbackEl.textContent = msg;
    feedbackEl.className = "feedback incorrect";
  }

  scoreDisplayEl.textContent = `Score: ${score}`;
  nextBtn.classList.remove("hidden");
  answered = true;
}

function handleMCQAnswer(selectedOption) {
  if (answered) return;

  const q = quizQuestions[currentIndex];
  const isCorrect = normalizeAnswer(selectedOption) === normalizeAnswer(q.answer);

  if (isCorrect) score++;
  showFeedback(isCorrect, q);
}

function handleTextAnswer() {
  if (answered) return;

  const q = quizQuestions[currentIndex];
  const userAnswer = normalizeAnswer(textAnswerInput.value);
  const validAnswers = getValidAnswers(q);
  const isCorrect = validAnswers.includes(userAnswer);

  if (isCorrect) score++;
  showFeedback(isCorrect, q);
}

function goToNextQuestion() {
  currentIndex++;

  if (currentIndex >= quizQuestions.length) {
    showResults();
  } else {
    renderQuestion();
  }
}

function showResults() {
  quizScreen.classList.add("hidden");
  resultsScreen.classList.remove("hidden");
  finalScoreEl.textContent = `You got ${score} out of ${quizQuestions.length}.`;
}

startBtn.addEventListener("click", startQuiz);
checkBtn.addEventListener("click", handleTextAnswer);
nextBtn.addEventListener("click", goToNextQuestion);
restartBtn.addEventListener("click", () => {
  resultsScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
});

textAnswerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleTextAnswer();
  }
});

hintBtn.addEventListener("click", showHint);

loadCSV().catch(err => {
  console.error(err);
  homeMessage.textContent = "Could not load exercises.csv";
});