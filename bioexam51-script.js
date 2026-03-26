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
    const partsImg1 = [
        { id: 1, name: "Nasal Cavity", pctX: 40.0, pctY: 18.0 },
        { id: 2, name: "Oral Cavity", pctX: 43.0, pctY: 25.0 },
        { id: 3, name: "Epiglotis", pctX: 53.5, pctY: 28.8 },
        { id: 4, name: "Pharynx", pctX: 49.0, pctY: 21.0 },
        { id: 5, name: "Diaphragm", pctX: 55.5, pctY: 83.5 },
        { id: 6, name: "Upper right lobe", pctX: 44.0, pctY: 56.5 },
        { id: 7, name: "Middle lobe", pctX: 43.5, pctY: 70.5 },
        { id: 8, name: "Lower right lobe", pctX: 28.7, pctY: 75.6 },
        { id: 9, name: "Upper left lobe", pctX: 71.7, pctY: 60.6 },
        { id: 10, name: "Lower left lobe", pctX: 81.0, pctY: 76.6 }
    ];

    const partsImg2 = [
        { id: 11, name: "Larynx", pctX: 47.7, pctY: 13.0 },
        { id: 12, name: "Trachea", pctX: 48.5, pctY: 38.9 },
        { id: 13, name: "Carina", pctX: 48.5, pctY: 50.0 },
        { id: 14, name: "Bronchi", pctX: 30.8, pctY: 68.7 },
        { id: 15, name: "Broncheoles", pctX: 78.5, pctY: 84.0 }
    ];

    const diag1 = document.getElementById('diagram-1');
    const diag2 = document.getElementById('diagram-2');
    const hot1 = document.getElementById('hotspots-1');
    const hot2 = document.getElementById('hotspots-2');
    const inputsBox = document.getElementById('diagram-inputs-container');

    const renderHotspots = (parts, container) => {
        parts.forEach(p => {
            const dot = document.createElement('div');
            dot.className = 'hotspot';
            dot.textContent = p.id;
            dot.style.left = p.pctX + '%';
            dot.style.top = p.pctY + '%';
            container.appendChild(dot);
        });
    };

    const renderInputs = () => {
        inputsBox.innerHTML = '';
        const allParts = [...partsImg1, ...partsImg2];
        // Shuffle the inputs alphabetically to scramble the answers explicitly
        allParts.sort((a, b) => a.name.localeCompare(b.name));
        allParts.forEach(p => {
            const wrapper = document.createElement('div');
            wrapper.className = 'diag-part';
            wrapper.innerHTML = `<label>${p.name}:</label>`;

            const select = document.createElement('select');
            select.className = 'diag-select';
            select.dataset.targetId = p.id;

            let optionsHtml = `<option value="">--</option>`;
            for (let i = 1; i <= 15; i++) {
                optionsHtml += `<option value="${i}">${i}</option>`;
            }
            select.innerHTML = optionsHtml;
            wrapper.appendChild(select);
            inputsBox.appendChild(wrapper);
        });
    };

    if (hot1 && hot2) {
        renderHotspots(partsImg1, hot1);
        renderHotspots(partsImg2, hot2);
        renderInputs();
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
