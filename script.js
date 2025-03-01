document.addEventListener('DOMContentLoaded', () => {
    // Debug logging to help identify issues
    console.log('App initialized');
    
    // Global variables
    let quizData = {};
    let currentModule = '';
    let currentQuestions = [];
    let shuffledQuestions = [];
    let currentPage = 1;
    let questionsPerPage = 20;
    let score = 0;
    let answeredQuestions = new Set();
    let userAnswers = {};  // Store user answers by question index
    let correctAnswersCount = 0;

    // DOM elements
    const moduleSelection = document.getElementById('module-selection');
    const quizSection = document.getElementById('quiz-section');
    
    // FIX: Change from const to let to allow reassignment when needed
    let moduleCards = document.querySelectorAll('.module-card:not(.disabled)');
    
    const questionContainer = document.getElementById('question-container');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const restartQuizBtn = document.getElementById('restart-quiz');
    const backToModulesBtn = document.getElementById('back-to-modules');
    const resetProgressBtn = document.getElementById('reset-progress');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const currentQuestionSpan = document.getElementById('current-question');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const moduleTitle = document.getElementById('module-title');
    const scoreValue = document.getElementById('score-value');
    const progressFill = document.getElementById('progress-fill');
    
    // DOM elements for shortcuts and results
    const shortcutsInfoBtn = document.getElementById('shortcuts-info-btn');
    const shortcutsPanel = document.getElementById('shortcuts-panel');
    const resultsSummary = document.getElementById('results-summary');
    const totalResultQuestions = document.getElementById('total-result-questions');
    const answeredQuestionsElement = document.getElementById('answered-questions');
    const correctAnswersElement = document.getElementById('correct-answers');
    const accuracyRateElement = document.getElementById('accuracy-rate');
    const showResultsBtn = document.getElementById('show-results-btn');
    const hideResultsBtn = document.getElementById('hide-results-btn');

    // Initialize the app
    async function init() {
        await loadQuizData();
        setupEventListeners();
    }

    // Load quiz data
    async function loadQuizData() {
        try {
            console.log('Loading quiz data...');
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            quizData = await response.json();
            console.log('Quiz data loaded successfully:', Object.keys(quizData).length, 'modules found');
            
            // Validate the quiz data structure
            if (!quizData.module1 || !quizData.module2) {
                console.warn('Some expected modules are missing from the quiz data');
            }
            
            // Update UI to reflect available modules
            updateAvailableModules();
        } catch (error) {
            console.error('Error loading quiz data:', error);
            alert('Không thể tải dữ liệu câu hỏi. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // FIX: Update moduleCards reference before attaching listeners
        moduleCards = document.querySelectorAll('.module-card:not(.disabled)');
        
        moduleCards.forEach(card => {
            card.addEventListener('click', () => {
                const module = card.getAttribute('data-module');
                console.log('Module clicked:', module);
                startQuiz(module);
            });
        });

        prevPageBtn.addEventListener('click', navigateToPreviousPage);
        nextPageBtn.addEventListener('click', navigateToNextPage);
        restartQuizBtn.addEventListener('click', restartQuiz);
        backToModulesBtn.addEventListener('click', goBackToModuleSelection);
        resetProgressBtn.addEventListener('click', resetProgress);
        showResultsBtn.addEventListener('click', showResultsSummary);
        hideResultsBtn.addEventListener('click', hideResultsSummary);
        shortcutsInfoBtn.addEventListener('click', toggleShortcutsPanel);
        
        // Add keyboard navigation
        document.addEventListener('keydown', handleKeyboardNavigation);
    }

    // Handle keyboard navigation
    function handleKeyboardNavigation(event) {
        // Only handle keyboard events when quiz section is visible
        if (quizSection.classList.contains('hidden')) return;
        
        switch(event.key) {
            case 'ArrowLeft': // Left arrow for previous page
                if (!prevPageBtn.disabled) {
                    navigateToPreviousPage();
                }
                break;
            case 'ArrowRight': // Right arrow for next page
                if (!nextPageBtn.disabled) {
                    navigateToNextPage();
                }
                break;
            case 'Escape': // Escape key to go back to modules
                if (confirm('Bạn có muốn quay lại trang chọn module không?')) {
                    goBackToModuleSelection();
                }
                break;
            case 'r': // 'r' key to restart quiz
                if (event.ctrlKey) {
                    event.preventDefault();
                    restartQuiz();
                }
                break;
            case 's': // 's' key to show/hide results
                if (event.ctrlKey) {
                    event.preventDefault();
                    if (resultsSummary.classList.contains('hidden')) {
                        showResultsSummary();
                    } else {
                        hideResultsSummary();
                    }
                }
                break;
        }
    }

    // Toggle shortcuts panel visibility
    function toggleShortcutsPanel() {
        shortcutsPanel.classList.toggle('hidden');
    }

    // Save progress to localStorage with error handling
    function saveProgress() {
        try {
            const moduleProgress = {
                score,
                answeredQuestions: Array.from(answeredQuestions),
                userAnswers,
                currentPage,
                correctAnswersCount,
                lastAccessed: new Date().toISOString()
            };
            
            localStorage.setItem(`quizProgress_${currentModule}`, JSON.stringify(moduleProgress));
            console.log('Progress saved successfully');
        } catch (error) {
            console.error('Error saving progress:', error);
            
            // Check if it's a quota exceeded error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                alert('Không thể lưu tiến trình do bộ nhớ localStorage đã đầy. Vui lòng xóa bớt dữ liệu.');
            }
        }
    }

    // Load progress from localStorage
    function loadProgress(module) {
        try {
            const savedProgress = localStorage.getItem(`quizProgress_${module}`);
            
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                score = progress.score || 0;
                answeredQuestions = new Set(progress.answeredQuestions || []);
                userAnswers = progress.userAnswers || {};
                currentPage = progress.currentPage || 1;
                correctAnswersCount = progress.correctAnswersCount || 0;
                
                // Update score display
                scoreValue.textContent = score;
                
                // Only use saved progress if it's not too old (7 days)
                const lastAccessed = new Date(progress.lastAccessed);
                const now = new Date();
                const daysDiff = (now - lastAccessed) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > 7) {
                    resetModuleProgress(module);
                    return false;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error loading saved progress:', error);
        }
        
        return false;
    }

    // Reset progress for a specific module
    function resetModuleProgress(module) {
        localStorage.removeItem(`quizProgress_${module}`);
        score = 0;
        answeredQuestions.clear();
        userAnswers = {};
        currentPage = 1;
        correctAnswersCount = 0;
    }

    // Reset progress button handler
    function resetProgress() {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ tiến trình làm bài của module này?')) {
            resetModuleProgress(currentModule);
            startQuiz(currentModule);
        }
    }

    // Start the quiz for a selected module
    function startQuiz(module) {
        console.log('Starting quiz for module:', module);
        if (!quizData || !quizData[module]) {
            console.error('Module data not found:', module);
            alert('Module không tồn tại hoặc chưa được triển khai.');
            return;
        }

        console.log('Quiz data for module found, length:', quizData[module].length);
        currentModule = module;
        currentQuestions = [...quizData[module]];
        shuffleQuestions();
        updateModuleTitle();
        
        // Try to load saved progress
        const hasProgress = loadProgress(module);
        
        if (!hasProgress) {
            resetScore();
            currentPage = 1;
            answeredQuestions.clear();
            userAnswers = {};
            correctAnswersCount = 0;
        }
        
        updatePagination();
        displayQuestions();
        showQuizSection();
    }

    // Shuffle the questions and their answers
    function shuffleQuestions() {
        // Create a seeded random function based on module name to keep the order consistent
        let seedValue = currentModule.charCodeAt(currentModule.length - 1);  // Changed from const to let
        const seededRandom = () => {
            let x = Math.sin(seedValue++) * 10000;
            return x - Math.floor(x);
        };

        // First, create a copy of questions with consistent ordering
        shuffledQuestions = [...currentQuestions];
        
        // Shuffle the questions with seeded randomness
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        // Shuffle the answers for each question
        shuffledQuestions.forEach(question => {
            question.shuffledAnswers = [...question.answers];
            question.shuffledIndices = [0, 1, 2, 3];
            
            for (let i = question.shuffledAnswers.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom() * (i + 1));
                [question.shuffledAnswers[i], question.shuffledAnswers[j]] = [question.shuffledAnswers[j], question.shuffledAnswers[i]];
                [question.shuffledIndices[i], question.shuffledIndices[j]] = [question.shuffledIndices[j], question.shuffledIndices[i]];
            }
        });
    }

    // Display questions for the current page
    function displayQuestions() {
        questionContainer.innerHTML = '';
        const startIdx = (currentPage - 1) * questionsPerPage;
        const endIdx = Math.min(startIdx + questionsPerPage, shuffledQuestions.length);

        for (let i = startIdx; i < endIdx; i++) {
            const question = shuffledQuestions[i];
            const questionElement = createQuestionElement(question, i);
            questionContainer.appendChild(questionElement);
        }

        updateProgressBar();
        updateDisplayedQuestionRange();
    }

    // Create HTML element for a question - FIXED FUNCTION
    function createQuestionElement(question, index) {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-card');
        questionDiv.dataset.index = index;

        const questionText = document.createElement('div');
        questionText.classList.add('question-text');
        questionText.innerHTML = `<strong>${question.id}:</strong> ${question.question}`;
        questionDiv.appendChild(questionText);

        const options = document.createElement('div');
        options.classList.add('options');

        const prefixes = ['A', 'B', 'C', 'D'];
        
        question.shuffledAnswers.forEach((answer, idx) => {
            const option = document.createElement('div');
            option.classList.add('option');
            const originalIndex = question.shuffledIndices[idx];
            const isCorrect = prefixes[originalIndex] === question.correctAnswer;
            option.dataset.correct = isCorrect;
            option.dataset.prefix = prefixes[idx];
            option.dataset.index = idx;

            const optionPrefix = document.createElement('span');
            optionPrefix.classList.add('option-prefix');
            optionPrefix.textContent = prefixes[idx];

            const optionText = document.createElement('span');
            optionText.textContent = answer.substring(3); // Remove the prefix (e.g., "A. ")

            option.appendChild(optionPrefix);
            option.appendChild(optionText);
            
            option.addEventListener('click', () => handleAnswerSelection(option, questionDiv, isCorrect, index, idx));

            // Apply saved answer if exists
            if (answeredQuestions.has(index) && userAnswers[index] === idx) {
                if (isCorrect) {
                    option.classList.add('correct');
                } else {
                    option.classList.add('incorrect');
                }
            } else if (answeredQuestions.has(index) && isCorrect) {
                option.classList.add('correct');
            }
            
            options.appendChild(option);
        });

        questionDiv.appendChild(options);
        return questionDiv;
    }

    // Handle user's answer selection
    function handleAnswerSelection(selectedOption, questionDiv, isCorrect, questionIndex, optionIndex) {
        // If question already answered, do nothing
        if (answeredQuestions.has(questionIndex)) return;

        const options = questionDiv.querySelectorAll('.option');

        // Mark all options as selected/incorrect/correct
        options.forEach(option => {
            if (option === selectedOption) {
                if (isCorrect) {
                    option.classList.add('correct');
                    increaseScore();
                    correctAnswersCount++; // Increment correct answers count
                } else {
                    option.classList.add('incorrect');
                }
            } else if (option.dataset.correct === 'true') {
                option.classList.add('correct');
            }
        });

        // Mark question as answered and save user's choice
        answeredQuestions.add(questionIndex);
        userAnswers[questionIndex] = optionIndex;
        
        updateProgressBar();
        updateResultsSummary(); // Update results when an answer is selected
        saveProgress();
    }

    // Update the progress bar
    function updateProgressBar() {
        const progress = (answeredQuestions.size / shuffledQuestions.length) * 100;
        progressFill.style.width = `${progress}%`;
    }

    // Increase the score
    function increaseScore() {
        score++;
        scoreValue.textContent = score;
    }

    // Reset the score
    function resetScore() {
        score = 0;
        scoreValue.textContent = score;
    }

    // Navigate to the previous page of questions
    function navigateToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            displayQuestions();
            updatePagination();
            window.scrollTo(0, 0);
            saveProgress();
        }
    }

    // Navigate to the next page of questions
    function navigateToNextPage() {
        const totalPages = Math.ceil(shuffledQuestions.length / questionsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayQuestions();
            updatePagination();
            window.scrollTo(0, 0);
            saveProgress();
        }
    }

    // Update pagination display
    function updatePagination() {
        const totalPages = Math.ceil(shuffledQuestions.length / questionsPerPage);
        currentPageSpan.textContent = currentPage;
        totalPagesSpan.textContent = totalPages;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // Update module title
    function updateModuleTitle() {
        const moduleId = currentModule.replace('module', '');
        moduleTitle.textContent = `Module ${moduleId}`;
    }

    // Update the displayed question range
    function updateDisplayedQuestionRange() {
        const startIdx = (currentPage - 1) * questionsPerPage + 1;
        const endIdx = Math.min(currentPage * questionsPerPage, shuffledQuestions.length);
        
        currentQuestionSpan.textContent = startIdx;
        totalQuestionsSpan.textContent = shuffledQuestions.length;
    }

    // Show the quiz section and hide module selection
    function showQuizSection() {
        moduleSelection.classList.add('hidden');
        quizSection.classList.remove('hidden');
        hideResultsSummary(); // Make sure results are hidden when starting
    }

    // Go back to module selection
    function goBackToModuleSelection() {
        quizSection.classList.add('hidden');
        moduleSelection.classList.remove('hidden');
    }

    // Restart the current quiz
    function restartQuiz() {
        if (confirm('Bạn có chắc chắn muốn làm lại bài thi này?\nCác câu trả lời và điểm số sẽ được giữ lại trong bộ nhớ.')) {
            currentPage = 1;
            displayQuestions();
            updatePagination();
            window.scrollTo(0, 0);
        }
    }

    // Show results summary
    function showResultsSummary() {
        resultsSummary.classList.remove('hidden');
        showResultsBtn.style.display = 'none';
        hideResultsBtn.style.display = 'inline-block';
        updateResultsSummary();
        
        // Scroll to the bottom to show results
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // Hide results summary
    function hideResultsSummary() {
        resultsSummary.classList.add('hidden');
        showResultsBtn.style.display = 'inline-block';
        hideResultsBtn.style.display = 'none';
    }

    // Update results summary
    function updateResultsSummary() {
        totalResultQuestions.textContent = shuffledQuestions.length;
        answeredQuestionsElement.textContent = answeredQuestions.size;
        correctAnswersElement.textContent = correctAnswersCount;
        
        let accuracyRate = 0;
        if (answeredQuestions.size > 0) {
            accuracyRate = Math.round((correctAnswersCount / answeredQuestions.size) * 100);
        }
        accuracyRateElement.textContent = `${accuracyRate}%`;
    }

    // Update UI to reflect available modules
    function updateAvailableModules() {
        // FIX: Update moduleCards reference before processing
        moduleCards = document.querySelectorAll('.module-card:not(.disabled)');
        
        moduleCards.forEach(card => {
            const module = card.getAttribute('data-module');
            if (!quizData[module]) {
                card.classList.add('disabled');
                card.setAttribute('title', 'Module này chưa có dữ liệu');
            } else {
                // Check if user has progress in this module
                const savedProgress = localStorage.getItem(`quizProgress_${module}`);
                if (savedProgress) {
                    try {
                        const progress = JSON.parse(savedProgress);
                        if (progress.answeredQuestions && quizData[module].length) {
                            const completionPct = (progress.answeredQuestions.length / quizData[module].length) * 100;
                            
                            // Remove existing progress indicator if it exists
                            const existingIndicator = card.querySelector('.module-progress');
                            if (existingIndicator) {
                                existingIndicator.remove();
                            }
                            
                            // Create new progress indicator
                            const progressIndicator = document.createElement('div');
                            progressIndicator.classList.add('module-progress');
                            progressIndicator.innerHTML = `
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${completionPct}%"></div>
                                </div>
                                <span>${Math.round(completionPct)}% hoàn thành</span>
                            `;
                            card.appendChild(progressIndicator);
                        }
                    } catch (e) {
                        console.error('Error parsing saved progress:', e);
                    }
                }
            }
        });
        
        // Update the moduleCards reference after potentially disabling some cards
        moduleCards = document.querySelectorAll('.module-card:not(.disabled)');
    }

    // Create a method to export user's progress and results
    window.exportResults = function() {
        if (!currentModule || !shuffledQuestions.length) {
            alert('Vui lòng chọn module và làm bài trước khi xuất kết quả.');
            return;
        }
        
        try {
            const results = {
                module: currentModule,
                timestamp: new Date().toISOString(),
                score: score,
                totalQuestions: shuffledQuestions.length,
                answeredQuestions: answeredQuestions.size,
                correctAnswers: correctAnswersCount,
                accuracyRate: answeredQuestions.size ? Math.round((correctAnswersCount / answeredQuestions.size) * 100) : 0
            };
            
            // Create a downloadable file
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `quiz_results_${currentModule}_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            // Show success message
            alert('Kết quả đã được xuất thành công!');
        } catch (error) {
            console.error('Error exporting results:', error);
            alert('Có lỗi khi xuất kết quả. Vui lòng thử lại sau.');
        }
    };

    // Initialize the app
    init();
});
