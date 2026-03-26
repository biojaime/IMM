document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loginContainer = document.getElementById('login-container');
    const loginConfirm = document.getElementById('login-confirm');
    const examContainer = document.getElementById('exam-container');
    const resultsContainer = document.getElementById('results-container');

    const studentIdInput = document.getElementById('student-id');
    const verifyIdBtn = document.getElementById('verify-id-btn');
    const loginError = document.getElementById('login-error');

    const confirmName = document.getElementById('confirm-name');
    const confirmGradeInfo = document.getElementById('confirm-grade');
    const confirmGroupInfo = document.getElementById('confirm-group');
    const startExamBtn = document.getElementById('start-exam-btn');
    const cancelExamBtn = document.getElementById('cancel-exam-btn');

    const displayName = document.getElementById('display-name');
    const displayDate = document.getElementById('display-date');
    const displayId = document.getElementById('display-id');
    const displayGradeBar = document.getElementById('display-grade');
    const displayGroupBar = document.getElementById('display-group');

    const submitBtn = document.getElementById('submit-exam-btn');
    const submitMsg = document.getElementById('submit-msg');
    const finalScoreEl = document.getElementById('final-score');

    const rainContainer = document.getElementById('rain-container');

    // --- State ---
    let currentStudent = null;
    let stepScores = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, match: 0, diag: 0 };

    // Apps Script URL configured as requested
    const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVkP68kdrlfkT4SNcAXfedtLpJASdFpDUy0MMMpmL6s5SkN71OT2Vi9FS-s7YmEBRM/exec";

    const matchConcepts = [
        "Lungs", "Alveoli", "Bronchi", "Nose", "Pharynx", "Larynx", "Trachea",
        "Type 1 Pneumocyte", "Type 2 Pneumocyte"
    ];

    document.querySelectorAll('.match-select').forEach(select => {
        matchConcepts.forEach(concept => {
            const opt = document.createElement('option');
            opt.value = concept;
            opt.textContent = concept;
            select.appendChild(opt);
        });
    });

    const today = new Date();
    displayDate.textContent = today.toLocaleDateString();

    // --- Login Logic ---
    verifyIdBtn.addEventListener('click', async () => {
        const id = studentIdInput.value.trim();
        if (!id) {
            loginError.textContent = "Please enter a valid Student ID.";
            return;
        }

        verifyIdBtn.disabled = true;
        verifyIdBtn.textContent = "Verifying...";
        loginError.textContent = "";

        // Testing direct mock or fetch
        if (id === "0000001") {
            setTimeout(() => {
                currentStudent = { matricula: id, nombre: "Test Student (Default)", grado: "3", grupo: "A" };
                showConfirmScreen();
            }, 500);
        } else {
            try {
                const response = await fetch(`${GOOGLE_APP_SCRIPT_URL}?action=getStudent&matricula=${id}`);
                const data = await response.json();

                if (data.success) {
                    currentStudent = data;
                    showConfirmScreen();
                } else {
                    loginError.textContent = "Matrícula no encontrada.";
                    verifyIdBtn.disabled = false;
                    verifyIdBtn.textContent = "Verify ID";
                }
            } catch (err) {
                console.error("Error fetching logic:", err);
                loginError.textContent = "Error de conexión. Fallback activado para probar.";
                currentStudent = { matricula: id, nombre: "Estudiante Fallback", grado: "1", grupo: "B" };
                showConfirmScreen();
            }
        }
    });

    function showConfirmScreen() {
        loginContainer.classList.add('hidden');
        loginConfirm.classList.remove('hidden');
        confirmName.textContent = currentStudent.nombre;
        confirmGradeInfo.textContent = currentStudent.grado;
        confirmGroupInfo.textContent = currentStudent.grupo;
    }

    cancelExamBtn.addEventListener('click', () => {
        loginConfirm.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        verifyIdBtn.disabled = false;
        verifyIdBtn.textContent = "Verify ID";
        studentIdInput.value = "";
    });

    startExamBtn.addEventListener('click', () => {
        loginConfirm.classList.add('hidden');
        examContainer.classList.remove('hidden');

        displayName.textContent = currentStudent.nombre;
        displayId.textContent = currentStudent.matricula;
        displayGradeBar.textContent = currentStudent.grado;
        displayGroupBar.textContent = currentStudent.grupo;
    });

    // --- Animations ---
    function fireConfetti() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2ecc71', '#003366', '#ffffff']
            });
        }
    }

    function createRain() {
        rainContainer.classList.remove('hidden');
        const count = 30;
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.classList.add('drop');
            drop.textContent = '😢';
            drop.style.left = Math.random() * 100 + 'vw';
            drop.style.animationDuration = Math.random() * 1 + 1 + 's';
            drop.style.animationDelay = Math.random() * 2 + 's';
            rainContainer.appendChild(drop);
        }
        setTimeout(() => {
            rainContainer.classList.add('hidden');
            rainContainer.innerHTML = '';
        }, 3000);
    }

    // --- Validation Logic & Step Navigation ---
    const answers = {
        1: ['gas', 'oxygen', 'oxigeno', 'respirar', 'breathe', 'exchange'],
        2: ['lung', 'pulmones', 'pulmon', 'lungs'],
        3: ['pneumocyte', 'neumocito'], // User updated MFU
        4: ['chemical', 'quimica', 'químico', 'quimico'],
        5: ['physical', 'fisica', 'física', 'fisico']
    };

    const correctMatches = [
        "Bronchi", "Trachea", "Type 2 Pneumocyte", "Lungs", "Alveoli",
        "Type 1 Pneumocyte", "Pharynx", "Larynx", "Nose"
    ];

    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const stepId = parseInt(e.target.dataset.step);

            if (stepId >= 1 && stepId <= 5) {
                // Open questions validation
                const input = document.getElementById(`q${stepId}`);
                const val = input.value.trim().toLowerCase();
                const fb = document.getElementById(`fb-${stepId}`);

                if (!val) {
                    fb.textContent = "Please enter an answer.";
                    fb.className = "feedback-msg wrong";
                    return;
                }

                // Check keyword match
                const isCorrect = answers[stepId].some(kw => val.includes(kw));

                if (isCorrect) {
                    fb.textContent = "Correct! Well done.";
                    fb.className = "feedback-msg correct";
                    stepScores[`q${stepId}`] = 2; // 2 pts each
                    fireConfetti();
                    setTimeout(() => goToStep(stepId + 1), 1500);
                } else {
                    fb.textContent = "Incorrect.";
                    fb.className = "feedback-msg wrong";
                    createRain();
                    setTimeout(() => goToStep(stepId + 1), 1800);
                }
            } else if (stepId === 6) {
                // Matching validation logic
                let allCorrect = true;
                let matchScore = 0;
                const selects = document.querySelectorAll('.match-select');
                selects.forEach((select, i) => {
                    if (select.value === correctMatches[i]) {
                        matchScore += 2;
                    } else {
                        allCorrect = false;
                    }
                });

                stepScores['match'] = matchScore; // Store score regardless

                if (allCorrect) {
                    fireConfetti();
                    setTimeout(() => goToStep(stepId + 1), 1500);
                } else {
                    // Move forward without confetti if wrong
                    // (User said: "solo darle clic al boton next")
                    goToStep(stepId + 1);
                }
            }
        });
    });

    function goToStep(nextStep) {
        document.querySelectorAll('.step-card').forEach(c => c.classList.add('hidden'));
        const nextCard = document.getElementById(`step-${nextStep}`);
        if (nextCard) {
            nextCard.classList.remove('hidden');
        }
    }

    // --- Diagram Logic Generation ---
    const diagramParts = [
        { id: 1, name: "Nasal Cavity", x: 611, y: 310 },
        { id: 2, name: "Oral Cavity", x: 622, y: 349 },
        { id: 3, name: "Epiglotis", x: 664, y: 373 },
        { id: 4, name: "Pharynx", x: 676, y: 337 },
        { id: 5, name: "Diaphragm", x: 672, y: 701 },
        { id: 6, name: "Upper right lobe", x: 626, y: 539 },
        { id: 7, name: "Middle lobe", x: 624, y: 623 },
        { id: 8, name: "Lower right lobe", x: 565, y: 654 },
        { id: 9, name: "Upper left lobe", x: 737, y: 564 },
        { id: 10, name: "Lower left lobe", x: 774, y: 660 },
        { id: 11, name: "Larynx", x: 1217, y: 222 },
        { id: 12, name: "Trachea", x: 1220, y: 364 },
        { id: 13, name: "Carina", x: 1220, y: 481 },
        { id: 14, name: "Bronchi", x: 1158, y: 528 },
        { id: 15, name: "Broncheoles", x: 1325, y: 613 }
    ];

    const mainDiagram = document.getElementById('main-diagram');
    const hotspotsContainer = document.getElementById('hotspots-container');
    const diagramInputsContainer = document.getElementById('diagram-inputs-container');

    if (mainDiagram && hotspotsContainer && diagramInputsContainer) {
        const initDiagram = () => {
            // Check if coordinates were based on a 1366 or 1440 screen screenshot
            // Based on x=1325, image is likely around 1366px or 1440px or larger
            // We use naturalWidth, but for screenshots it might be slightly off.
            // Using 1366x768 as a sensible default if naturalWidth is 0.
            let natW = mainDiagram.naturalWidth || 1366;
            let natH = mainDiagram.naturalHeight || 768;

            // Render Hotspots & Dropdowns
            hotspotsContainer.innerHTML = '';
            diagramInputsContainer.innerHTML = '';

            diagramParts.forEach(part => {
                const dot = document.createElement('div');
                dot.className = 'hotspot';
                dot.textContent = part.id;
                dot.style.left = (part.x / natW) * 100 + '%';
                dot.style.top = (part.y / natH) * 100 + '%';
                hotspotsContainer.appendChild(dot);

                const wrapper = document.createElement('div');
                wrapper.className = 'diag-part';
                wrapper.innerHTML = `<label>${part.name}:</label>`;

                const select = document.createElement('select');
                select.className = 'diag-select';
                select.dataset.targetId = part.id;

                let optionsHtml = `<option value="">--</option>`;
                for (let i = 1; i <= 15; i++) {
                    optionsHtml += `<option value="${i}">${i}</option>`;
                }
                select.innerHTML = optionsHtml;

                wrapper.appendChild(select);
                diagramInputsContainer.appendChild(wrapper);
            });
        };

        if (mainDiagram.complete) {
            initDiagram();
        } else {
            mainDiagram.onload = initDiagram;
        }
    }


    // --- Submit Logic (Diagram & Final) ---
    submitBtn.addEventListener('click', () => {
        let diagScore = 0;
        document.querySelectorAll('.diag-select').forEach(sel => {
            if (parseInt(sel.value) === parseInt(sel.dataset.targetId)) {
                diagScore += 1;
            }
        });

        stepScores['diag'] = diagScore;

        // 10 pts (open) + 18 pts (match) + 15 pts (diag) = 43 pts total
        let totalScore = stepScores.q1 + stepScores.q2 + stepScores.q3 + stepScores.q4 + stepScores.q5 + stepScores.match + diagScore;
        const maxScore = 10 + 18 + 15; // 43
        const calculatedGrade = (totalScore / maxScore) * 100;

        const payload = {
            action: 'updateScore',
            matricula: currentStudent.matricula,
            points: totalScore,
            grade: calculatedGrade.toFixed(2)
        };

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        submitMsg.textContent = "Sending your results...";

        fetch(GOOGLE_APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(() => {
            showResults(totalScore, maxScore, calculatedGrade.toFixed(2));
        }).catch(err => {
            submitMsg.textContent = "No connection. Simulating local completion.";
            setTimeout(() => showResults(totalScore, maxScore, calculatedGrade.toFixed(2)), 1500);
        });
    });

    function showResults(score, maxScore, grade) {
        document.getElementById('step-7').classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        finalScoreEl.innerHTML = `${score} / ${maxScore} pts<br><span style="font-size: 1.5rem; color: #555;">Final Grade: ${grade}</span>`;
    }
});
