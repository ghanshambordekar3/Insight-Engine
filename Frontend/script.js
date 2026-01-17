let uploadedFile = null;
const API_URL = 'http://localhost:5000';
let globalResults = null; // Store results for interactivity
let chartInstances = {}; // Store chart instances to destroy them before redrawing

// Sample Data for Demo
const sampleData = {
    summary: {
        total_records: 5000,
        total_columns: 8,
        numeric_columns: 5,
        categorical_columns: 3,
        missing_values: 0,
        data_quality_score: 98.5
    },
    statistics: {
        "Sales": { mean: 12500.50, std: 3200.00, min: 5000, max: 25000 },
        "Customers": { mean: 450.20, std: 80.00, min: 100, max: 900 },
        "Growth": { mean: 12.5, std: 2.1, min: 5, max: 20 },
        "Satisfaction": { mean: 4.8, std: 0.3, min: 3.5, max: 5.0 }
    },
    patterns: [
        { type: "Correlation", description: "Strong positive correlation between Sales and Customers", value: "0.89" },
        { type: "Trend", description: "Growth shows a steady increasing trend", value: "+1.2%" },
        { type: "Seasonality", description: "Peak activity detected in Q4", value: "High" }
    ],
    predictions: {
        target_column: "Sales",
        model_used: "Random Forest (Enterprise)",
        model_score: 0.965,
        mse: 850.25,
        future_predictions: [12800, 13100, 13500, 13200, 14000, 14500, 14200, 15000, 15500, 16000]
    }
};

function toggleMobileMenu() {
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.mobile-menu-toggle');
    nav.classList.toggle('mobile-open');
    btn.classList.toggle('active');
}

function showPage(pageName, clickedButton) {
    // Determine swipe direction
    const navBtns = Array.from(document.querySelectorAll('.nav-btn'));
    const currentBtn = document.querySelector('.nav-btn.active');
    const currentIndex = currentBtn ? navBtns.indexOf(currentBtn) : -1;

    let activeButton;
    if (clickedButton) {
        activeButton = clickedButton;
    } else {
        activeButton = document.querySelector(`.nav-btn[onclick*="'${pageName}'"]`);
    }

    const newIndex = activeButton ? navBtns.indexOf(activeButton) : -1;
    let swipeClass = '';

    if (currentIndex !== -1 && newIndex !== -1 && currentIndex !== newIndex) {
        swipeClass = newIndex > currentIndex ? 'swipe-right' : 'swipe-left';
    }

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active', 'swipe-right', 'swipe-left');
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const page = document.getElementById(pageName);
    if (swipeClass) page.classList.add(swipeClass);
    page.classList.add('active');

    if (activeButton) {
        activeButton.classList.add('active');
        updateNavIndicator(activeButton);
    }

    // Close mobile menu if open
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.mobile-menu-toggle');
    if (nav.classList.contains('mobile-open')) {
        nav.classList.remove('mobile-open');
        btn.classList.remove('active');
    }

    // Re-trigger animation for content and interactive elements
    const animatedElements = page.querySelectorAll('.content-card, .feature-card, .stat-box, .insight-card, .stat-item');
    animatedElements.forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight; /* trigger reflow */
        el.style.animation = null; 
    });

    if (pageName === 'home') {
        setTimeout(animateCounters, 300);
    }
}

function updateNavIndicator(activeButton) {
    const indicator = document.querySelector('.nav-indicator');
    if (!indicator || !activeButton) return;

    const nav = activeButton.parentElement;
    if (nav.offsetParent === null) return; // Don't run if nav is not visible

    const navRect = nav.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    indicator.style.width = `${buttonRect.width}px`;
    indicator.style.left = `${buttonRect.left - navRect.left}px`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Set initial indicator position after animations
    setTimeout(() => updateNavIndicator(document.querySelector('.nav-btn.active')), 500);

    // Custom select arrow rotation
    document.querySelectorAll('.control-select').forEach(select => {
        const wrapper = select.closest('.select-wrapper');
        if (wrapper) {
            select.addEventListener('focus', () => {
                wrapper.classList.add('is-open');
            });
            select.addEventListener('blur', () => {
                wrapper.classList.remove('is-open');
            });
        }
    });
});

// Intro Page Transition
function startApp() {
    const btn = document.querySelector('.start-btn');
    btn.style.transform = 'scale(0.95)';
    btn.style.opacity = '0.9';

    setTimeout(() => {
        const overlay = document.getElementById('intro-overlay');
        overlay.classList.add('hidden');
        
        const container = document.querySelector('.container');
        
        container.classList.add('active-container');

        setTimeout(() => {
            overlay.style.display = 'none';
            updateNavIndicator(document.querySelector('.nav-btn.active'));
        }, 800);
        setTimeout(animateCounters, 900);
    }, 100);
}

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('dragover');
    }, false);
});

uploadArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.csv')) {
            uploadedFile = file;
            document.getElementById('fileName').textContent = `Selected: ${file.name}`;
            document.getElementById('analyzeBtn').disabled = false;
            showMessage('File ready for analysis!', 'success');
            parseCSVHeaders(file);
        } else {
            showMessage('Please upload a CSV file', 'error');
        }
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.name.endsWith('.csv')) {
            uploadedFile = file;
            document.getElementById('fileName').textContent = `Selected: ${file.name}`;
            document.getElementById('analyzeBtn').disabled = false;
            showMessage('File ready for analysis!', 'success');
            parseCSVHeaders(file);
        } else {
            showMessage('Please upload a CSV file', 'error');
            uploadedFile = null;
            document.getElementById('analyzeBtn').disabled = true;
            document.getElementById('predictionControls').style.display = 'none';
        }
    }
}

function parseCSVHeaders(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const firstLine = text.split('\n')[0];
        const headers = firstLine.split(',').map(h => h.trim());
        const select = document.getElementById('targetColumn');
        select.innerHTML = '<option value="">Auto-detect Target</option>';
        headers.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = h;
            select.appendChild(option);
        });
        document.getElementById('predictionControls').style.display = 'block';
    };
    reader.readAsText(file);
}

function showMessage(message, type) {
    const msgDiv = document.getElementById('uploadMessage');
    msgDiv.className = type;
    msgDiv.textContent = message;
    setTimeout(() => {
        msgDiv.className = '';
        msgDiv.textContent = '';
    }, 3000);
}

async function analyzeData() {
    if (!uploadedFile) {
        showMessage('Please select a file first', 'error');
        return;
    }

    const loader = document.getElementById('loader');
    const analyzeBtn = document.getElementById('analyzeBtn');

    loader.classList.add('active');
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('target_column', document.getElementById('targetColumn').value);
    formData.append('model_type', document.getElementById('modelType').value);

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const results = await response.json();
        globalResults = results; // Store for column insights
        displayResults(results);
        showMessage('Analysis completed successfully!', 'success');

        // Switch to dashboard
        setTimeout(() => {
            showPage('dashboard');
        }, 1000);

    } catch (error) {
        showMessage('Error analyzing data. Make sure the Flask server is running on port 5000.', 'error');
        console.error('Error:', error);
    } finally {
        loader.classList.remove('active');
        analyzeBtn.disabled = false;
    }
}

function loadSampleData() {
    const loader = document.getElementById('loader');
    loader.classList.add('active');
    
    // Simulate network delay for realism
    setTimeout(() => {
        globalResults = sampleData;
        displayResults(globalResults);
        loader.classList.remove('active');
        showMessage('Sample enterprise data loaded successfully!', 'success');
        
        setTimeout(() => {
            showPage('dashboard');
        }, 1000);
    }, 1500);
}

function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // ms
        const increment = target / (duration / 16); // 60fps
        
        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target.toLocaleString();
            }
        };
        updateCounter();
    });
}

function displayResults(results) {
    // Display Dashboard
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
                <div class="insight-card" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none;">
                    <h3 style="color: white;">🛡️ Data Quality Score: ${results.summary.data_quality_score}%</h3>
                    <p style="color: rgba(255,255,255,0.8);">Based on missing values, duplicates, and consistency.</p>
                </div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value">${results.summary.total_records}</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${results.summary.total_columns}</div>
                        <div class="stat-label">Columns</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${results.summary.numeric_columns}</div>
                        <div class="stat-label">Numeric Columns</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${results.summary.categorical_columns}</div>
                        <div class="stat-label">Categorical</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${results.summary.missing_values}</div>
                        <div class="stat-label">Missing Values</div>
                    </div>
                </div>

                <h3 style="margin-top: 30px;">📊 Statistical Summary</h3>
                <div id="statsTable"></div>

                <h3 style="margin-top: 30px;">🤖 AI-Generated Insights</h3>
                ${results.patterns.map(p => `
                    <div class="insight-card">
                        <h4>${p.type}</h4>
                        <p>${p.description}</p>
                        ${p.value ? `<p><strong>Value: ${p.value}</strong></p>` : ''}
                    </div>
                `).join('')}

                <div class="chart-container">
                    <canvas id="barChart"></canvas>
                </div>
            `;

    // Setup Column Insights
    setupColumnInsights(results.statistics);

    // Display statistics table
    displayStatsTable(results.statistics);

    // Create bar chart
    createBarChart(results.statistics);

    // Display Predictions
    const predictionsContent = document.getElementById('predictionsContent');
    predictionsContent.innerHTML = `
                <h3>🎯 Model Performance</h3>
                <div class="insight-card">
                    <p>Target: <strong>${results.predictions.target_column}</strong> | Model: <strong>${results.predictions.model_used}</strong></p>
                    <h4>Model Accuracy</h4>
                    <p>R² Score: <strong>${results.predictions.model_score.toFixed(4)}</strong></p>
                    <p>Mean Squared Error: <strong>${results.predictions.mse.toFixed(4)}</strong></p>
                </div>

                <h3 style="margin-top: 30px;">📈 Future Predictions</h3>
                ${results.predictions.future_predictions.map((pred, idx) => `
                    <div class="prediction-item">
                        <span>Prediction ${idx + 1}</span>
                        <strong>${pred.toFixed(2)}</strong>
                    </div>
                `).join('')}

                <div class="chart-container">
                    <canvas id="lineChart"></canvas>
                </div>
            `;

    // Create line chart for predictions
    createLineChart(results.predictions);
}

function setupColumnInsights(statistics) {
    const select = document.getElementById('columnSelect');
    const section = document.getElementById('columnInsightsSection');
    
    select.innerHTML = '<option value="">Select a Column to Analyze</option>';
    Object.keys(statistics).forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        select.appendChild(option);
    });
    
    section.style.display = 'block';
}

window.updateColumnStats = function() {
    const col = document.getElementById('columnSelect').value;
    const display = document.getElementById('columnStatsDisplay');
    
    if (!col || !globalResults) return;
    
    const stats = globalResults.statistics[col];
    let html = '';
    
    for (const [key, value] of Object.entries(stats)) {
        html += `<div class="stat-box">
                    <div class="stat-value">${typeof value === 'number' ? value.toFixed(2) : value}</div>
                    <div class="stat-label">${key}</div>
                 </div>`;
    }
    display.innerHTML = html;
};

function displayStatsTable(statistics) {
    const statsTable = document.getElementById('statsTable');
    const columns = Object.keys(statistics);

    let html = '<div class="table-responsive"><table>';
    html += '<thead><tr><th>Metric</th>';

    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    const metrics = ['mean', 'std', 'min', 'max'];
    metrics.forEach((metric, idx) => {
        html += `<tr>`;
        html += `<td>${metric.toUpperCase()}</td>`;
        columns.forEach(col => {
            const value = statistics[col][metric];
            html += `<td>${typeof value === 'number' ? value.toFixed(2) : value}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    statsTable.innerHTML = html;
}

function createBarChart(statistics) {
    const canvas = document.getElementById('barChart');
    
    if (chartInstances.bar) chartInstances.bar.destroy();

    const columns = Object.keys(statistics);
    // Filter only numeric columns that have a mean
    const numericCols = columns.filter(col => statistics[col].mean !== undefined);
    const means = numericCols.map(col => statistics[col].mean);

    chartInstances.bar = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: numericCols,
            datasets: [{
                label: 'Average Value',
                data: means,
                backgroundColor: 'rgba(129, 140, 248, 0.6)',
                borderColor: '#818cf8',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Column Means Comparison'
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createLineChart(predictions) {
    const canvas = document.getElementById('lineChart');

    if (chartInstances.line) chartInstances.line.destroy();

    const data = predictions.future_predictions;
    const labels = data.map((_, i) => `Step ${i + 1}`);

    chartInstances.line = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted Trend',
                data: data,
                borderColor: '#c084fc',
                backgroundColor: 'rgba(192, 132, 252, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Future Trend Forecast'
                }
            }
        }
    });
}

function downloadReport() {
    if (!globalResults) {
        alert('No data available. Please analyze data first.');
        return;
    }

    // Create a new window for the report
    const reportWindow = window.open('', '_blank', 'width=1200,height=800');

    // Generate comprehensive report HTML with enhanced visibility and attractiveness
    const reportHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Data Analysis Report</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.8;
                    color: #2d3748;
                    margin: 0;
                    padding: 30px;
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    min-height: 100vh;
                }
                .section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e2e8f0;
                }
                .section h2 {
                    color: #4c51bf;
                    border-bottom: 3px solid #9f7aea;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                    font-size: 22px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .stat-box {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }
                .stat-value {
                    font-size: 28px;
                    font-weight: bold;
                    display: block;
                    margin-bottom: 5px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                .stat-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.9;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 14px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
                th, td {
                    border: 1px solid #e2e8f0;
                    padding: 12px 15px;
                    text-align: left;
                }
                th {
                    background: linear-gradient(135deg, #4c51bf 0%, #9f7aea 100%);
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                tr:nth-child(even) {
                    background: #f8fafc;
                }
                tr:hover {
                    background: #edf2f7;
                }
                .insight-card {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 18px;
                    border-radius: 10px;
                    margin: 12px 0;
                    border-left: 4px solid #ff6b6b;
                    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
                }
                .insight-card h4 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    font-weight: bold;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                }
                .insight-card p {
                    margin: 5px 0;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .insight-card strong {
                    color: #ffd93d;
                    font-weight: bold;
                }
                .prediction-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
                    margin: 8px 0;
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 3px 10px rgba(168, 237, 234, 0.3);
                }
                .prediction-item span {
                    font-weight: 600;
                    font-size: 15px;
                    color: #2d3748;
                }
                .prediction-item strong {
                    color: #e53e3e;
                    font-size: 18px;
                    font-weight: bold;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
                .model-performance {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                }
                .model-performance p {
                    margin: 8px 0;
                    font-size: 15px;
                }
                .model-performance strong {
                    color: #ffd93d;
                    font-weight: bold;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 20px;
                        background: white !important;
                    }
                    .section {
                        page-break-inside: avoid;
                        box-shadow: none !important;
                        border: 1px solid #ccc !important;
                        margin-bottom: 30px;
                    }
                    .stat-box, .insight-card, .prediction-item, .model-performance {
                        box-shadow: none !important;
                        border: 1px solid #999 !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="section">
                <h2>📊 Executive Summary</h2>
                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-value">${globalResults.summary.total_records.toLocaleString()}</span>
                        <span class="stat-label">Total Records</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${globalResults.summary.total_columns}</span>
                        <span class="stat-label">Total Columns</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${globalResults.summary.numeric_columns}</span>
                        <span class="stat-label">Numeric Columns</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">${globalResults.summary.data_quality_score}%</span>
                        <span class="stat-label">Data Quality Score</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📈 Statistical Summary</h2>
                ${generateStatsTableHTML(globalResults.statistics)}
            </div>

            <div class="section">
                <h2>🤖 AI-Generated Insights</h2>
                ${globalResults.patterns.map(p => `
                    <div class="insight-card">
                        <h4>${p.type}</h4>
                        <p>${p.description}</p>
                        ${p.value ? `<p><strong>Value: ${p.value}</strong></p>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="section">
                <h2>🎯 Prediction Model Performance</h2>
                <div class="model-performance">
                    <p><strong>Target Column:</strong> ${globalResults.predictions.target_column}</p>
                    <p><strong>Model Used:</strong> ${globalResults.predictions.model_used}</p>
                    <p><strong>R² Score:</strong> ${globalResults.predictions.model_score.toFixed(4)}</p>
                    <p><strong>Mean Squared Error:</strong> ${globalResults.predictions.mse.toFixed(4)}</p>
                </div>
            </div>

            <div class="section">
                <h2>📈 Future Trend Forecast</h2>
                ${globalResults.predictions.future_predictions.map((pred, idx) => `
                    <div class="prediction-item">
                        <span>Prediction ${idx + 1}</span>
                        <strong>${pred.toFixed(2)}</strong>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;

    // Write the report to the new window
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();

    // Wait for content to load, then trigger print
    reportWindow.onload = function() {
        setTimeout(() => {
            reportWindow.print();
        }, 500);
    };
}

function generateStatsTableHTML(statistics) {
    const columns = Object.keys(statistics);
    let html = '<table>';
    html += '<thead><tr><th>Metric</th>';

    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    const metrics = ['mean', 'std', 'min', 'max'];
    metrics.forEach(metric => {
        html += `<tr><td>${metric.toUpperCase()}</td>`;
        columns.forEach(col => {
            const value = statistics[col][metric];
            html += `<td>${typeof value === 'number' ? value.toFixed(2) : value}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}
