/**
 * ==========================================================================
 * 長崎ケンポー団 - B2B Landing Page アプリケーションロジック
 * データに基づく健康経営・保険料削減シミュレーター＆可視化
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Lucide Icon の初期化
    if (window.lucide) {
        lucide.createIcons();
    }

    // 1. 各種チャートの初期化
    initRateGapChart();
    initCorrelationScatterChart();
    
    // 2. 保険料削減シミュレーターの初期化
    initSimulator();

    // 3. モーダル表示制御の初期化
    initModals();
});

/* ==========================================================================
   1. Chart.js 可視化関数
   ========================================================================== */

/**
 * 課題セクション：長崎県 vs 新潟県の年収別保険料負担額比較グラフ
 */
function initRateGapChart() {
    const ctx = document.getElementById('rateGapChart');
    if (!ctx) return;

    // 年収（万円）
    const salaries = [300, 400, 500, 600, 800];
    
    // 長崎県（10.45% / 労使折半）年間負担額（円）
    const nagasakiCosts = salaries.map(s => Math.round((s * 10000) * (0.1045 / 2)));
    // 新潟県（9.35% / 労使折半）年間負担額（円）
    const niigataCosts = salaries.map(s => Math.round((s * 10000) * (0.0935 / 2)));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: salaries.map(s => `年収 ${s}万円`),
            datasets: [
                {
                    label: '長崎県 (10.45%) 会社負担額/人',
                    data: nagasakiCosts,
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    borderColor: '#EF4444',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: '新潟県 (9.35%) 会社負担額/人',
                    data: niigataCosts,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94A3B8', font: { family: 'Noto Sans JP' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.raw.toLocaleString();
                            return `${context.dataset.label}: 年間 ${val} 円`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94A3B8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    ticks: { 
                        color: '#94A3B8',
                        callback: value => (value / 10000) + '万円'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

/**
 * 分析セクション：特定健診受診率 VS 医療費（一人当たり療養給付費）の相関グラフ
 */
function initCorrelationScatterChart() {
    const ctx = document.getElementById('correlationScatterChart');
    if (!ctx) return;

    // 都道府県イメージプロットデータ (健診率 %, 1人あたり療養給付費 万円)
    const prefData = [
        { x: 42.1, y: 34.5, pref: '長崎県 (ワーストクラス)' },
        { x: 58.4, y: 28.1, pref: '新潟県 (トップクラス)' },
        { x: 44.0, y: 33.2, pref: 'A県' },
        { x: 46.5, y: 32.8, pref: 'B県' },
        { x: 48.0, y: 31.5, pref: 'C県' },
        { x: 50.2, y: 30.9, pref: 'D県' },
        { x: 52.1, y: 29.8, pref: 'E県' },
        { x: 55.0, y: 28.9, pref: 'F県' },
        { x: 43.5, y: 34.0, pref: 'G県' },
        { x: 51.5, y: 30.2, pref: 'H県' },
        { x: 56.8, y: 28.3, pref: 'I県' }
    ];

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '長崎県',
                    data: [prefData[0]],
                    backgroundColor: '#EF4444',
                    pointRadius: 10,
                    pointHoverRadius: 12
                },
                {
                    label: '新潟県',
                    data: [prefData[1]],
                    backgroundColor: '#10B981',
                    pointRadius: 10,
                    pointHoverRadius: 12
                },
                {
                    label: '他都道府県',
                    data: prefData.slice(2),
                    backgroundColor: 'rgba(148, 163, 184, 0.6)',
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94A3B8', font: { family: 'Noto Sans JP' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.pref}: 特定健診率 ${point.x}% / 一人あたり療養給付費 ${point.y}万円`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '特定健診受診率 (%)', color: '#94A3B8' },
                    ticks: { color: '#94A3B8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    title: { display: true, text: '一人当たり年間療養給付費 (万円)', color: '#94A3B8' },
                    ticks: { color: '#94A3B8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                }
            }
        }
    });
}

/* ==========================================================================
   2. 保険料削減シミュレーター制御
   ========================================================================== */
let simChartInstance = null;

function initSimulator() {
    const empInput = document.getElementById('employeeCount');
    const salaryInput = document.getElementById('avgSalary');
    const currentInput = document.getElementById('currentCheckup');
    const targetInput = document.getElementById('targetCheckup');

    if (!empInput || !salaryInput || !currentInput || !targetInput) return;

    // イベントリスナーの登録
    [empInput, salaryInput, currentInput, targetInput].forEach(el => {
        el.addEventListener('input', updateSimulatorResults);
    });

    // 初期計算
    updateSimulatorResults();
}

/**
 * シミュレーター入力値から削減額・生産性効果を計算して画面を更新
 */
function updateSimulatorResults() {
    const emp = parseInt(document.getElementById('employeeCount').value, 10);
    const salaryTenThousand = parseInt(document.getElementById('avgSalary').value, 10); // 万円
    const currentCheckup = parseInt(document.getElementById('currentCheckup').value, 10);
    const targetCheckup = parseInt(document.getElementById('targetCheckup').value, 10);

    // ラベル表示の更新
    document.getElementById('employeeCountVal').textContent = `${emp} 人`;
    document.getElementById('avgSalaryVal').textContent = `${salaryTenThousand} 万円`;
    document.getElementById('currentCheckupVal').textContent = `${currentCheckup} %`;
    document.getElementById('targetCheckupVal').textContent = `${targetCheckup} %`;

    // 1. 健診受診率の向上幅（%）
    const deltaCheckup = Math.max(0, targetCheckup - currentCheckup);

    // 2. データ分析モデルに基づく計算：
    // 特定健診受診率が10%向上のとき、保険料率が -0.11% 低下
    const rateDropPercent = (deltaCheckup / 10) * 0.11; // %単位
    const currentRate = 10.45; // 長崎県基準
    const newRate = Math.max(9.0, currentRate - rateDropPercent);

    // 3. 会社負担の社会保険料削減額（年間）
    // 年間全社額面給与 = emp * (salaryTenThousand * 10,000)
    // 労使折半なので、会社負担削減率 = (rateDropPercent / 100) / 2
    const totalPayroll = emp * (salaryTenThousand * 10000);
    const companySavings = Math.round(totalPayroll * ((rateDropPercent / 100) / 2));

    // 4. 県民1人あたり生産性向上額（年間）
    // 特定健診10%向上で1人当たり+20万円の総生産向上効果（GAMモデル解析結果より）
    const productivityPerPerson = (deltaCheckup / 10) * 200000;
    const totalProductivityEffect = Math.round(emp * productivityPerPerson);

    // 5. 画面表示の更新
    document.getElementById('companySavingsDisplay').textContent = `￥${companySavings.toLocaleString()}`;
    document.getElementById('rateDropDisplay').textContent = `-${rateDropPercent.toFixed(2)}%`;
    document.getElementById('newRateDisplay').textContent = `${newRate.toFixed(2)}%`;
    document.getElementById('productivityDisplay').textContent = `+￥${(totalProductivityEffect / 10000).toLocaleString()}万円`;

    // 6. 試算結果チャートの更新
    updateSimChart(totalPayroll, companySavings);
}

/**
 * シミュレーター結果チャート（変更前後の会社負担社会保険料比較）
 */
function updateSimChart(totalPayroll, companySavings) {
    const ctx = document.getElementById('simResultChart');
    if (!ctx) return;

    // 現在の会社負担額 (10.45% / 2)
    const currentCompanyCost = Math.round(totalPayroll * (0.1045 / 2));
    // 改善後の会社負担額
    const afterCompanyCost = currentCompanyCost - companySavings;

    if (simChartInstance) {
        simChartInstance.data.datasets[0].data = [currentCompanyCost, afterCompanyCost];
        simChartInstance.update();
    } else {
        simChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['現在の年間会社負担', '健診改善後の会社負担'],
                datasets: [{
                    label: '会社負担 社会保険料 (円)',
                    data: [currentCompanyCost, afterCompanyCost],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.75)',
                        'rgba(245, 158, 11, 0.85)'
                    ],
                    borderColor: [
                        '#EF4444',
                        '#F59E0B'
                    ],
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ￥${context.raw.toLocaleString()} 円`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: '#94A3B8',
                            callback: value => (value / 10000) + '万円'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    y: {
                        ticks: { color: '#ffffff', font: { family: 'Noto Sans JP', weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
}

/* ==========================================================================
   3. モーダル操作イベント
   ========================================================================== */
function initModals() {
    const modal = document.getElementById('download-modal');
    if (!modal) return;

    const triggers = document.querySelectorAll('.modal-trigger');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const downloadForm = document.getElementById('downloadForm');

    // 開く
    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
    });

    // 閉じる
    const closeModal = () => modal.classList.remove('active');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    // フォーム送信アクション
    if (downloadForm) {
        downloadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const company = document.getElementById('companyName').value;
            alert(`【お申込み完了】\n${company} 様、ご登録ありがとうございます。\n長崎ケンポー団の特別データレポート（PDF）のダウンロードリンクをメールでお送りしました。`);
            closeModal();
        });
    }
}
