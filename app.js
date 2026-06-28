/**
 * QuizMaster Pro - Main Application
 * Handles: Quiz engine, timer, navigation, analytics, keyboard shortcuts, export
 */

// ===== STATE =====
const state = {
    questions: [],
    currentIndex: 0,
    answers: [],
    timerInterval: null,
    timerSeconds: 0,
    isAnswered: false,
    selectedOption: -1,
    quizStarted: false,
};

// ===== DOM ELEMENTS =====
const DOM = {
    uploadScreen: document.getElementById('uploadScreen'),
    quizScreen: document.getElementById('quizScreen'),
    resultsScreen: document.getElementById('resultsScreen'),
    uploadArea: document.getElementById('uploadArea'),
    pdfInput: document.getElementById('pdfInput'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    loadSampleBtn: document.getElementById('loadSampleBtn'),
    topicBadge: document.getElementById('topicBadge'),
    currentQNum: document.getElementById('currentQNum'),
    totalQNum: document.getElementById('totalQNum'),
    quizProgressFill: document.getElementById('quizProgressFill'),
    timer: document.getElementById('timer'),
    timerValue: document.getElementById('timerValue'),
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    questionCategory: document.getElementById('questionCategory'),
    optionsContainer: document.getElementById('optionsContainer'),
    submitSection: document.getElementById('submitSection'),
    submitBtn: document.getElementById('submitBtn'),
    feedbackSection: document.getElementById('feedbackSection'),
    feedbackBanner: document.getElementById('feedbackBanner'),
    feedbackIcon: document.getElementById('feedbackIcon'),
    feedbackText: document.getElementById('feedbackText'),
    solutionSection: document.getElementById('solutionSection'),
    showSolutionBtn: document.getElementById('showSolutionBtn'),
    solutionContent: document.getElementById('solutionContent'),
    solutionText: document.getElementById('solutionText'),
    prevBtn: document.getElementById('prevBtn'),
    skipBtn: document.getElementById('skipBtn'),
    nextBtn: document.getElementById('nextBtn'),
    finishBtn: document.getElementById('finishBtn'),
    scoreFill: document.getElementById('scoreFill'),
    scoreValue: document.getElementById('scoreValue'),
    statCorrect: document.getElementById('statCorrect'),
    statWrong: document.getElementById('statWrong'),
    statSkipped: document.getElementById('statSkipped'),
    statAvgTime: document.getElementById('statAvgTime'),
    categoryList: document.getElementById('categoryList'),
    resultsTableBody: document.getElementById('resultsTableBody'),
    retryBtn: document.getElementById('retryBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    newQuizBtn: document.getElementById('newQuizBtn'),
    themeToggle: document.getElementById('themeToggle'),
    shortcutsBtn: document.getElementById('shortcutsBtn'),
    shortcutsModal: document.getElementById('shortcutsModal'),
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupUploadHandlers();
    setupNavigationHandlers();
    setupThemeToggle();
    setupKeyboardShortcuts();
    setupResultsHandlers();
}

// ===== UPLOAD HANDLERS =====
function setupUploadHandlers() {
    DOM.uploadArea.addEventListener('click', () => DOM.pdfInput.click());
    DOM.pdfInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
    });
    DOM.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); DOM.uploadArea.classList.add('drag-over'); });
    DOM.uploadArea.addEventListener('dragleave', () => { DOM.uploadArea.classList.remove('drag-over'); });
    DOM.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault(); DOM.uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    });
    DOM.loadSampleBtn.addEventListener('click', loadSampleQuestions);
}

async function handleFileUpload(file) {
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file.'); return; }
    DOM.uploadProgress.classList.add('active');
    const parser = new PDFQuestionParser();
    try {
        const questions = await parser.parsePDF(file, (progress, text) => {
            DOM.progressFill.style.width = progress + '%';
            DOM.progressText.textContent = text;
        });
        if (questions.length === 0) {
            DOM.progressText.textContent = 'No questions found. Try sample questions or a different PDF.';
            DOM.progressFill.style.width = '100%';
            DOM.progressFill.style.background = 'var(--danger)';
            return;
        }
        setTimeout(() => startQuiz(questions), 500);
    } catch (error) {
        DOM.progressText.textContent = 'Error: ' + error.message;
        DOM.progressFill.style.background = 'var(--danger)';
    }
}

// ===== SAMPLE QUESTIONS =====
function loadSampleQuestions() {
    const sampleQuestions = [
        { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correctAnswer: 0, category: "Technology", explanation: "HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages and web applications." },
        { question: "Which data structure uses LIFO (Last In, First Out) principle?", options: ["Queue", "Stack", "Array", "Linked List"], correctAnswer: 1, category: "Programming", explanation: "A Stack uses the LIFO (Last In, First Out) principle. The last element added is the first one removed. Think of it like a stack of plates." },
        { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: 1, category: "Programming", explanation: "Binary search has O(log n) time complexity because it divides the search space in half with each comparison." },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctAnswer: 2, category: "Science", explanation: "Mars is known as the Red Planet because of iron oxide (rust) on its surface, giving it a reddish appearance." },
        { question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correctAnswer: 2, category: "Geography", explanation: "Tokyo is the capital of Japan and the most populous metropolitan area in the world." },
        { question: "In JavaScript, which keyword declares a block-scoped variable?", options: ["var", "let", "function", "global"], correctAnswer: 1, category: "Programming", explanation: "'let' declares a block-scoped variable in JavaScript. Unlike 'var' which is function-scoped." },
        { question: "What does CSS stand for?", options: ["Computer Style Sheets", "Creative Style System", "Cascading Style Sheets", "Colorful Style Sheets"], correctAnswer: 2, category: "Technology", explanation: "CSS stands for Cascading Style Sheets. It describes how HTML elements should be displayed on screen." },
        { question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort - O(n\u00b2)", "Merge Sort - O(n log n)", "Selection Sort - O(n\u00b2)", "Insertion Sort - O(n\u00b2)"], correctAnswer: 1, category: "Programming", explanation: "Merge Sort has O(n log n) average and worst-case time complexity, making it one of the most efficient comparison-based sorting algorithms." },
        { question: "What is the speed of light approximately?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correctAnswer: 0, category: "Science", explanation: "The speed of light in a vacuum is approximately 299,792 km/s (commonly rounded to 300,000 km/s)." },
        { question: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "404", "500"], correctAnswer: 2, category: "Technology", explanation: "HTTP 404 means 'Not Found'. 200 = OK, 301 = Moved Permanently, 500 = Internal Server Error." },
        { question: "What is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], correctAnswer: 3, category: "Geography", explanation: "The Pacific Ocean is the largest and deepest ocean, covering approximately 165.25 million km\u00b2." },
        { question: "In Python, which function gets the length of a list?", options: ["size()", "length()", "len()", "count()"], correctAnswer: 2, category: "Programming", explanation: "In Python, len() is the built-in function to get the number of items in a collection. Example: len([1,2,3]) returns 3." }
    ];
    startQuiz(sampleQuestions);
}

// ===== QUIZ ENGINE =====
function startQuiz(questions) {
    state.questions = questions;
    state.currentIndex = 0;
    state.answers = questions.map(() => ({ selectedIndex: -1, isCorrect: false, timeTaken: 0, status: 'unattempted' }));
    state.quizStarted = true;
    showScreen('quiz');
    DOM.totalQNum.textContent = questions.length;
    loadQuestion(0);
}

function loadQuestion(index) {
    const q = state.questions[index];
    const answer = state.answers[index];
    state.currentIndex = index;
    state.isAnswered = answer.status !== 'unattempted';
    state.selectedOption = answer.selectedIndex;

    DOM.currentQNum.textContent = index + 1;
    DOM.topicBadge.textContent = `Topic: ${q.category || 'General'}`;
    updateProgressBar();
    DOM.questionNumber.textContent = `Q${index + 1}`;
    DOM.questionText.textContent = q.question;
    DOM.questionCategory.innerHTML = `<span class="category-tag">Category: ${q.category || 'General'}</span>`;

    renderOptions(q, answer);
    updateNavButtons();
    resetTimer();

    if (!state.isAnswered) {
        startTimer();
    } else {
        DOM.timerValue.textContent = formatTime(answer.timeTaken);
    }

    if (state.isAnswered) {
        showFeedback(answer.isCorrect);
        DOM.solutionSection.classList.add('active');
        DOM.submitSection.style.display = 'none';
    } else {
        DOM.feedbackSection.classList.remove('active');
        DOM.solutionSection.classList.remove('active');
        DOM.solutionContent.classList.remove('active');
        DOM.showSolutionBtn.style.display = '';
        DOM.submitSection.style.display = 'block';
    }

    document.querySelector('.quiz-body').scrollTop = 0;
}

function renderOptions(question, answer) {
    const keys = ['A', 'B', 'C', 'D'];
    DOM.optionsContainer.innerHTML = '';
    question.options.forEach((option, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.dataset.index = i;
        btn.innerHTML = `<span class="option-key">${keys[i]}</span><span class="option-text">${option}</span>`;
        if (state.isAnswered) {
            btn.classList.add('locked');
            if (i === question.correctAnswer) btn.classList.add('correct');
            if (i === answer.selectedIndex && !answer.isCorrect) btn.classList.add('wrong');
        } else {
            if (i === state.selectedOption) btn.classList.add('selected');
            btn.addEventListener('click', () => selectOption(i));
        }
        DOM.optionsContainer.appendChild(btn);
    });
}

function selectOption(index) {
    if (state.isAnswered) return;
    state.selectedOption = index;
    DOM.submitBtn.disabled = false;
    const buttons = DOM.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => { btn.classList.toggle('selected', i === index); });
}

function submitAnswer() {
    if (state.selectedOption === -1 || state.isAnswered) return;
    const q = state.questions[state.currentIndex];
    const isCorrect = state.selectedOption === q.correctAnswer;
    stopTimer();
    state.isAnswered = true;
    state.answers[state.currentIndex] = { selectedIndex: state.selectedOption, isCorrect: isCorrect, timeTaken: state.timerSeconds, status: isCorrect ? 'correct' : 'wrong' };

    const buttons = DOM.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        btn.classList.add('locked');
        if (i === q.correctAnswer) btn.classList.add('correct');
        if (i === state.selectedOption && !isCorrect) btn.classList.add('wrong');
    });

    showFeedback(isCorrect);
    DOM.solutionSection.classList.add('active');
    DOM.submitSection.style.display = 'none';
    updateProgressBar();
}

function showFeedback(isCorrect) {
    DOM.feedbackSection.classList.add('active');
    DOM.feedbackBanner.className = 'feedback-banner ' + (isCorrect ? 'correct' : 'wrong');
    DOM.feedbackIcon.innerHTML = isCorrect ? '&#10004;' : '&#10008;';
    DOM.feedbackText.textContent = isCorrect ? 'Correct! Well done!' : 'Incorrect. Check the solution below.';
}

function showSolution() {
    const q = state.questions[state.currentIndex];
    DOM.solutionText.textContent = q.explanation || 'Solution not available for this question.';
    DOM.solutionContent.classList.add('active');
    DOM.showSolutionBtn.style.display = 'none';
}

// ===== TIMER =====
function startTimer() {
    state.timerSeconds = 0;
    DOM.timerValue.textContent = '00:00';
    DOM.timer.className = 'timer';
    state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        DOM.timerValue.textContent = formatTime(state.timerSeconds);
        if (state.timerSeconds >= 60) { DOM.timer.className = 'timer danger'; }
        else if (state.timerSeconds >= 30) { DOM.timer.className = 'timer warning'; }
    }, 1000);
}

function stopTimer() { if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } }
function resetTimer() { stopTimer(); state.timerSeconds = 0; DOM.timerValue.textContent = '00:00'; DOM.timer.className = 'timer'; }
function formatTime(seconds) { const mins = Math.floor(seconds / 60).toString().padStart(2, '0'); const secs = (seconds % 60).toString().padStart(2, '0'); return `${mins}:${secs}`; }

// ===== NAVIGATION =====
function setupNavigationHandlers() {
    DOM.prevBtn.addEventListener('click', goToPrevious);
    DOM.nextBtn.addEventListener('click', goToNext);
    DOM.skipBtn.addEventListener('click', skipQuestion);
    DOM.submitBtn.addEventListener('click', submitAnswer);
    DOM.showSolutionBtn.addEventListener('click', showSolution);
    DOM.finishBtn.addEventListener('click', finishQuiz);
}

function goToNext() { if (state.currentIndex < state.questions.length - 1) loadQuestion(state.currentIndex + 1); }
function goToPrevious() { if (state.currentIndex > 0) loadQuestion(state.currentIndex - 1); }

function skipQuestion() {
    if (!state.isAnswered) {
        stopTimer();
        state.answers[state.currentIndex] = { selectedIndex: -1, isCorrect: false, timeTaken: state.timerSeconds, status: 'skipped' };
    }
    if (state.currentIndex < state.questions.length - 1) { loadQuestion(state.currentIndex + 1); }
    else { updateNavButtons(); }
}

function updateNavButtons() {
    const isFirst = state.currentIndex === 0;
    const isLast = state.currentIndex === state.questions.length - 1;
    DOM.prevBtn.style.display = isFirst ? 'none' : 'inline-flex';
    DOM.nextBtn.style.display = isLast ? 'none' : 'inline-flex';
    const allAttempted = state.answers.every(a => a.status !== 'unattempted');
    DOM.finishBtn.style.display = (isLast || allAttempted) ? 'inline-flex' : 'none';
}

function updateProgressBar() {
    const answered = state.answers.filter(a => a.status !== 'unattempted').length;
    DOM.quizProgressFill.style.width = (answered / state.questions.length) * 100 + '%';
}

function showScreen(screen) {
    DOM.uploadScreen.classList.remove('active');
    DOM.quizScreen.classList.remove('active');
    DOM.resultsScreen.classList.remove('active');
    switch (screen) {
        case 'upload': DOM.uploadScreen.classList.add('active'); break;
        case 'quiz': DOM.quizScreen.classList.add('active'); break;
        case 'results': DOM.resultsScreen.classList.add('active'); break;
    }
}

// ===== RESULTS & ANALYTICS =====
function finishQuiz() { stopTimer(); showScreen('results'); calculateAndDisplayResults(); }

function calculateAndDisplayResults() {
    const total = state.questions.length;
    const correct = state.answers.filter(a => a.status === 'correct').length;
    const wrong = state.answers.filter(a => a.status === 'wrong').length;
    const skipped = state.answers.filter(a => a.status === 'skipped').length;
    const unattempted = state.answers.filter(a => a.status === 'unattempted').length;
    const answeredQuestions = state.answers.filter(a => a.status !== 'unattempted' && a.status !== 'skipped');
    const totalTime = answeredQuestions.reduce((sum, a) => sum + a.timeTaken, 0);
    const avgTime = answeredQuestions.length > 0 ? Math.round(totalTime / answeredQuestions.length) : 0;
    const scorePercent = Math.round((correct / total) * 100);

    const circumference = 339.292;
    const offset = circumference - (scorePercent / 100) * circumference;
    DOM.scoreFill.style.strokeDashoffset = offset;
    DOM.scoreValue.textContent = scorePercent + '%';
    DOM.statCorrect.textContent = correct;
    DOM.statWrong.textContent = wrong;
    DOM.statSkipped.textContent = skipped + unattempted;
    DOM.statAvgTime.textContent = avgTime + 's';

    renderCategoryBreakdown();
    renderResultsTable();
}

function renderCategoryBreakdown() {
    const categories = {};
    state.questions.forEach((q, i) => {
        const cat = q.category || 'General';
        if (!categories[cat]) categories[cat] = { total: 0, correct: 0 };
        categories[cat].total++;
        if (state.answers[i].status === 'correct') categories[cat].correct++;
    });
    DOM.categoryList.innerHTML = '';
    for (const [name, data] of Object.entries(categories)) {
        const percent = Math.round((data.correct / data.total) * 100);
        const color = percent >= 70 ? 'var(--success)' : percent >= 40 ? 'var(--warning)' : 'var(--danger)';
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `<div class="category-item-name">${name}</div><div class="category-item-bar"><div class="category-item-fill" style="width: ${percent}%; background: ${color};"></div></div><div class="category-item-score" style="color: ${color};">${data.correct}/${data.total}</div>`;
        DOM.categoryList.appendChild(item);
    }
}

function renderResultsTable() {
    DOM.resultsTableBody.innerHTML = '';
    const keys = ['A', 'B', 'C', 'D'];
    state.questions.forEach((q, i) => {
        const answer = state.answers[i];
        const row = document.createElement('tr');
        let yourAnswer = '-';
        if (answer.selectedIndex >= 0) yourAnswer = keys[answer.selectedIndex] + '. ' + q.options[answer.selectedIndex];
        const correctAnswer = keys[q.correctAnswer] + '. ' + q.options[q.correctAnswer];
        const timeStr = answer.timeTaken > 0 ? formatTime(answer.timeTaken) : '-';
        let statusClass = '', statusText = '';
        switch (answer.status) {
            case 'correct': statusClass = 'status-correct'; statusText = '\u2714 Correct'; break;
            case 'wrong': statusClass = 'status-wrong'; statusText = '\u2718 Wrong'; break;
            case 'skipped': statusClass = 'status-skipped'; statusText = '\u21B7 Skipped'; break;
            default: statusClass = 'status-skipped'; statusText = '\u2014 Unattempted'; break;
        }
        row.innerHTML = `<td>${i + 1}</td><td title="${q.question}">${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}</td><td>${yourAnswer.substring(0, 30)}${yourAnswer.length > 30 ? '...' : ''}</td><td>${correctAnswer.substring(0, 30)}${correctAnswer.length > 30 ? '...' : ''}</td><td>${timeStr}</td><td class="${statusClass}">${statusText}</td>`;
        DOM.resultsTableBody.appendChild(row);
    });
}

function setupResultsHandlers() {
    DOM.retryBtn.addEventListener('click', () => startQuiz(state.questions));
    DOM.newQuizBtn.addEventListener('click', () => {
        state.questions = []; state.answers = []; state.quizStarted = false;
        showScreen('upload');
        DOM.uploadProgress.classList.remove('active');
        DOM.progressFill.style.width = '0%';
        DOM.progressFill.style.background = '';
    });
    DOM.exportJsonBtn.addEventListener('click', exportResults);
}

// ===== EXPORT =====
function exportResults() {
    const results = {
        quizDate: new Date().toISOString(),
        totalQuestions: state.questions.length,
        score: { correct: state.answers.filter(a => a.status === 'correct').length, wrong: state.answers.filter(a => a.status === 'wrong').length, skipped: state.answers.filter(a => a.status === 'skipped' || a.status === 'unattempted').length, percentage: Math.round((state.answers.filter(a => a.status === 'correct').length / state.questions.length) * 100) },
        details: state.questions.map((q, i) => ({ questionNumber: i + 1, question: q.question, category: q.category, options: q.options, correctAnswer: q.options[q.correctAnswer], yourAnswer: state.answers[i].selectedIndex >= 0 ? q.options[state.answers[i].selectedIndex] : 'Not answered', status: state.answers[i].status, timeTaken: state.answers[i].timeTaken + 's' }))
    };
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `quiz-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
}

// ===== THEME TOGGLE =====
function setupThemeToggle() {
    const savedTheme = localStorage.getItem('quizmaster-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    DOM.themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('quizmaster-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) { DOM.themeToggle.querySelector('.theme-icon').innerHTML = theme === 'dark' ? '&#127769;' : '&#9728;'; }

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
    DOM.shortcutsBtn.addEventListener('click', () => { DOM.shortcutsModal.classList.add('active'); });
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'Escape') { DOM.shortcutsModal.classList.remove('active'); return; }
        if (!state.quizStarted || !DOM.quizScreen.classList.contains('active')) return;
        switch (e.key) {
            case '1': selectOption(0); break;
            case '2': selectOption(1); break;
            case '3': selectOption(2); break;
            case '4': selectOption(3); break;
            case 'Enter': e.preventDefault(); if (!state.isAnswered && state.selectedOption >= 0) submitAnswer(); break;
            case 'n': case 'N': goToNext(); break;
            case 'p': case 'P': goToPrevious(); break;
            case 's': case 'S': if (!state.isAnswered) skipQuestion(); break;
            case 'd': case 'D': toggleTheme(); break;
        }
    });
}
