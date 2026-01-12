// 全域變數
let currentUserEmail = '';
let periodsData = [];
let gearsData = [];
let currentDate = '';

// 初始化應用程式
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 載入初始資料
        await loadInitialData();
        
        // 設定日期選擇器
        setupDatePickers();
        
        // 載入今日資料
        updateBookingsByDate();
        updateGearStatusTable();
        
        // 設定事件監聽器
        setupEventListeners();
    } catch (error) {
        console.error('初始化失敗:', error);
        showAlert('系統初始化失敗：' + error.message, 'danger');
    }
});

// 載入初始資料
async function loadInitialData() {
    try {
        const response = await fetch(API_ENDPOINTS.getInitData);
        const data = await response.json();
        
        if (data.success) {
            currentUserEmail = data.email;
            periodsData = data.periods;
            gearsData = data.gears;
            
            // 更新 UI
            document.getElementById('emailDisplay').textContent = currentUserEmail;
            document.getElementById('openSpreadsheetLink').href = 
                `https://docs.google.com/spreadsheets/d/${API_CONFIG.SHEET_ID}/edit`;
            
            // 渲染節次和設備選項
            renderPeriods();
            renderGears();
            
            // 載入最近紀錄
            loadTop20Bookings();
        } else {
            throw new Error(data.message || '載入初始資料失敗');
        }
    } catch (error) {
        console.error('載入初始資料錯誤:', error);
        throw error;
    }
}

// 渲染節次選項
function renderPeriods() {
    const container = document.getElementById('periodsContainer');
    let html = '';
    
    // periodsData[0] 是標題列，從 [1] 開始
    for (let i = 1; i < periodsData.length; i++) {
        const periodId = periodsData[i][1];
        const periodName = periodsData[i][2];
        
        html += `
            <div class="col-lg-4 col-md-6 col-sm-6 mb-2">
                <div class="form-check">
                    <input class="form-check-input period-checkbox" type="checkbox" 
                           id="${periodId}" value="${periodName}"
                           onchange="checkGearAvailability()">
                    <label class="form-check-label" for="${periodId}">
                        ${periodName}
                    </label>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// 渲染設備選項
function renderGears() {
    const container = document.getElementById('gearContainer');
    let html = '';
    
    // gearsData[0] 是標題列，從 [1] 開始
    for (let i = 1; i < gearsData.length; i++) {
        const gearId = gearsData[i][0];
        const gearTitle = gearsData[i][1];
        const gearDescript = gearsData[i][2];
        const gearVisible = gearsData[i][3];
        
        // 只顯示可見的設備
        if (gearTitle && String(gearTitle).trim() !== '' && 
            (gearVisible === true || String(gearVisible).toUpperCase() === 'TRUE')) {
            
            html += `
                <div class="col-12 mb-2 gear-item" data-gear="${String(gearTitle).trim()}">
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="gearRadio" 
                               id="gear_${gearId}" value="${String(gearTitle).trim()}">
                        <label class="form-check-label" for="gear_${gearId}">
                            <strong>${String(gearTitle).trim()}</strong>
                            ${gearDescript && String(gearDescript).trim() !== '' ? 
                                `<br><small class="text-muted">${String(gearDescript).trim()}</small>` : ''}
                        </label>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
}

// 設定日期選擇器
function setupDatePickers() {
    const today = new Date();
    const todayString = formatDate(today);
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    const maxDateString = formatDate(maxDate);
    
    const dateInput = document.getElementById('booking_date');
    dateInput.min = todayString;
    dateInput.max = maxDateString;
    dateInput.value = todayString;
    
    const viewDateInput = document.getElementById('view_booking_date');
    viewDateInput.min = todayString;
    viewDateInput.max = maxDateString;
    viewDateInput.value = todayString;
    
    currentDate = todayString;
}

// 設定事件監聽器
function setupEventListeners() {
    // 其他設備選項
    document.querySelectorAll('input[name="gearRadio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const otherInput = document.getElementById('otherGearInput');
            if (this.value === 'other') {
                otherInput.style.display = 'block';
            } else {
                otherInput.style.display = 'none';
            }
        });
    });
}

// 顯示提示訊息
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    alertContainer.innerHTML = alertHtml;

    setTimeout(() => {
        const alert = alertContainer.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

// 驗證日期範圍
function validateDateRange() {
    const dateInput = document.getElementById('booking_date');
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    const maxDate = new Date();
    
    today.setHours(0, 0, 0, 0);
    maxDate.setDate(today.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);
    
    if (selectedDate < today) {
        showAlert('不能選擇過去的日期！', 'danger');
        dateInput.value = formatDate(today);
        return false;
    }
    
    if (selectedDate > maxDate) {
        showAlert('只能預約30天內的日期！', 'danger');
        dateInput.value = formatDate(maxDate);
        return false;
    }
    
    return true;
}

// 檢查設備可用性
async function checkGearAvailability() {
    const booking_date = document.getElementById('booking_date').value;
    const selectedPeriods = Array.from(document.querySelectorAll('.period-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    if (!booking_date || selectedPeriods.length === 0) {
        resetGearAvailability();
        updateAvailabilityInfo('請先選擇日期和節次來檢查設備可用性');
        return;
    }
    
    updateAvailabilityInfo('檢查設備可用性中...');
    
    try {
        const response = await fetch(API_ENDPOINTS.getAvailableGears, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: booking_date,
                periods: selectedPeriods
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const availableGears = data.gears;
            updateGearAvailability(availableGears);
            
            const unavailableCount = availableGears.filter(gear => !gear.available).length;
            if (unavailableCount > 0) {
                updateAvailabilityInfo(`${unavailableCount} 項設備在選定時間已被借用`);
            } else {
                updateAvailabilityInfo('所有設備在選定時間皆可借用');
            }
        } else {
            showAlert('檢查設備可用性失敗：' + data.message, 'danger');
            updateAvailabilityInfo('檢查設備可用性失敗');
        }
    } catch (error) {
        console.error('檢查設備可用性錯誤:', error);
        showAlert('檢查設備可用性失敗：' + error.message, 'danger');
        updateAvailabilityInfo('檢查設備可用性失敗');
    }
}

// 更新設備可用性顯示
function updateGearAvailability(availableGears) {
    const gearItems = document.querySelectorAll('.gear-item');
    
    gearItems.forEach(item => {
        const gearNameFromDataAttribute = item.dataset.gear;
        const gearInfo = availableGears.find(gear => gear.name === gearNameFromDataAttribute);
        const input = item.querySelector('input');
        const label = item.querySelector('label');

        if (!item.dataset.originalLabel) {
            item.dataset.originalLabel = label.innerHTML;
        }
        const originalLabelContent = item.dataset.originalLabel;
        
        if (gearInfo && !gearInfo.available) {
            item.classList.add('gear-unavailable');
            input.disabled = true;
            if (input.checked) { 
                input.checked = false;
            }
            label.innerHTML = originalLabelContent.replace(/<\/small>$/, ' (已借用)</small>')
                .replace(/<\/strong>$/, ' <span class="text-danger">(已借用)</span></strong>');
        } else {
            item.classList.remove('gear-unavailable');
            input.disabled = false;
            label.innerHTML = originalLabelContent;
        }
    });
}

// 重置設備可用性
function resetGearAvailability() {
    const gearItems = document.querySelectorAll('.gear-item');
    
    gearItems.forEach(item => {
        const input = item.querySelector('input');
        const label = item.querySelector('label');
        
        item.classList.remove('gear-unavailable');
        input.disabled = false;
        if (item.dataset.originalLabel) {
            label.innerHTML = item.dataset.originalLabel;
        }
    });
}

// 更新可用性提示訊息
function updateAvailabilityInfo(message) {
    const info = document.getElementById('availabilityInfo');
    info.innerHTML = '<i class="bi bi-info-circle me-1"></i>' + message;
}

// 提交表單
async function submitInput() {
    event.preventDefault();
    
    if (!validateDateRange()) {
        return false;
    }
    
    const booking_date = document.getElementById('booking_date').value;
    const selected_className = document.getElementById('selected_className').value;
    const teacherName = document.getElementById('teacherName').value;
    const classSubject = document.getElementById('classSubject').value;
    const descript = document.getElementById('descript').value;
    const selectedPeriods = Array.from(document.querySelectorAll('.period-checkbox:checked'))
        .map(checkbox => checkbox.value);

    if (selectedPeriods.length === 0) {
        showAlert('請至少選擇一個節次！', 'danger');
        return false;
    }

    const selectedRadio = document.querySelector('input[name="gearRadio"]:checked');
    let selectedGearRadioValue;

    if (selectedRadio) {
        if (selectedRadio.value === 'other') {
            const otherInput = document.querySelector('#otherGearInput input');
            selectedGearRadioValue = otherInput.value.trim();
            if (!selectedGearRadioValue) {
                showAlert('請輸入其他設備名稱！', 'danger');
                return false;
            }
        } else {
            selectedGearRadioValue = selectedRadio.value;
        }
    } else {
        showAlert('必須選擇要借的設備！', 'danger');
        return false;
    }

    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>提交中...';

    try {
        const response = await fetch(API_ENDPOINTS.updateSheet, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                booking_date,
                selected_className,
                teacherName,
                classSubject,
                descript,
                selectedPeriods,
                selectedGearRadioValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('新增成功！已同步到日曆系統。', 'success');
            
            const originalBookingDate = booking_date;
            
            document.getElementById('myForm').reset();
            document.getElementById('otherGearInput').style.display = 'none';
            resetGearAvailability();
            
            setupDatePickers();
            document.getElementById('booking_date').value = originalBookingDate;
            
            updateBookingsByDate();
            updateGearStatusTable();
            
            resetGearAvailability();
            updateAvailabilityInfo('請先選擇日期和節次來檢查設備可用性');
            
            setTimeout(() => {
                showAlert(`成功新增借用記錄並已同步到日曆！請查看右側面板確認 ${originalBookingDate} 的借用狀況。`, 'success');
            }, 500);
            
        } else {
            showAlert('新增失敗：' + data.message, 'danger');
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
    } catch (error) {
        console.error('提交錯誤:', error);
        showAlert('新增失敗：' + error.message, 'danger');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    return false;
}

// 根據日期更新借用記錄
async function updateBookingsByDate() {
    const booking_date_string = document.getElementById('booking_date').value;
    
    if (!booking_date_string) {
        return;
    }

    const title = document.getElementById('bookings_title');
    title.innerHTML = `<i class="bi bi-calendar-check me-2"></i>${booking_date_string} 已借用紀錄`;

    try {
        const response = await fetch(API_ENDPOINTS.getBookingsByDate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: booking_date_string })
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderBookingsTable(data.bookings);
        } else {
            showAlert('讀取預約日借用狀況失敗：' + data.message, 'danger');
        }
    } catch (error) {
        console.error('讀取借用記錄錯誤:', error);
        showAlert('讀取預約日借用狀況失敗：' + error.message, 'danger');
    }

    updateGearStatusTable();
}

// 從查看日期選擇器更新借用記錄
function updateBookingsByDateFromView() {
    const viewDate = document.getElementById('view_booking_date').value;
    document.getElementById('booking_date').value = viewDate;
    updateBookingsByDate();
}

// 渲染借用記錄表格
function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted p-4">
                    <i class="bi bi-inbox me-2"></i>當天無借用紀錄
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    bookings.forEach((booking, index) => {
        const columnsToShow = [0, 5, 2, 3, 6]; // 日期, 節次, 教師, 課程, 設備
        
        html += `<tr class="booking-row" style="cursor: pointer;" data-index="${index}">`;
        
        columnsToShow.forEach(columnIndex => {
            let cellData = booking[columnIndex];
            
            if (columnIndex === 0) {
                if (typeof cellData === 'string' && cellData.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // 已經是正確格式
                } else {
                    const date = new Date(cellData);
                    if (!isNaN(date.getTime())) {
                        cellData = formatDate(date);
                    } else {
                        cellData = "日期錯誤";
                    }
                }
            } else if (columnIndex === 5) {
                const className = booking[1];
                cellData = cellData + " (" + className + ")";
            }
            
            html += `<td class="text-truncate" style="max-width: 150px;" title="點擊查看詳細資料">${cellData}</td>`;
        });
        
        html += `</tr>`;
    });
    
    tbody.innerHTML = html;
    
    // 添加點擊事件
    tbody.querySelectorAll('.booking-row').forEach((row, index) => {
        row.addEventListener('click', () => showBookingDetails(bookings[index], index));
    });
}

// 顯示預約詳情
function showBookingDetails(booking, index) {
    // booking 結構：0=借用日期, 1=班級, 2=借用教師, 3=課程名稱, 4=其它說明, 5=節次, 6=設備, 7=timestamp
    
    let formattedDate = booking[0];
    if (typeof formattedDate !== 'string' || !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(formattedDate);
        if (!isNaN(date.getTime())) {
            formattedDate = formatDate(date);
        }
    }
    
    let formattedTimestamp = '';
    if (booking[7]) {
        const timestamp = new Date(booking[7]);
        if (!isNaN(timestamp.getTime())) {
            formattedTimestamp = formatDateTime(timestamp);
        }
    }
    
    const isAdmin = currentUserEmail === '555@tea.nknush.kh.edu.tw';
    
    const modalContent = `
        <div class="modal fade" id="bookingDetailModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-info-circle-fill me-2"></i>預約記錄詳細資料
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header bg-light">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-calendar3 me-1"></i>基本資訊
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td class="fw-bold text-muted" style="width: 35%;">借用日期：</td>
                                                <td>${formattedDate || '未提供'}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">節次：</td>
                                                <td>
                                                    <span class="badge bg-primary">${booking[5] || '未提供'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">班級：</td>
                                                <td>
                                                    <span class="badge bg-success">${booking[1] || '未提供'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">設備：</td>
                                                <td>
                                                    <span class="badge bg-warning text-dark">${booking[6] || '未提供'}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-header bg-light">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-person-badge me-1"></i>教學資訊
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td class="fw-bold text-muted" style="width: 35%;">任課教師：</td>
                                                <td>${booking[2] || '未提供'}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">科目/課程：</td>
                                                <td>${booking[3] || '未提供'}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">其他說明：</td>
                                                <td>
                                                    ${booking[4] && booking[4].trim() !== '' ? 
                                                        `<div class="alert alert-secondary py-2 px-3 mb-0 small">${booking[4]}</div>` : 
                                                        '<span class="text-muted">無</span>'
                                                    }
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row g-3 mt-2">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-gear me-1"></i>系統資訊
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <small class="text-muted">
                                                    <i class="bi bi-clock me-1"></i>建立時間：${formattedTimestamp || '未提供'}
                                                </small>
                                            </div>
                                            <div class="col-md-6">
                                                <small class="text-muted">
                                                    <i class="bi bi-hash me-1"></i>記錄編號：#${index + 1}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>關閉
                        </button>
                        <button type="button" class="btn btn-primary" onclick="copyBookingDetails('${encodeURIComponent(JSON.stringify(booking))}')">
                            <i class="bi bi-clipboard me-1"></i>複製資料
                        </button>
                        ${isAdmin ? `
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteBooking('${encodeURIComponent(JSON.stringify(booking))}', ${index})">
                            <i class="bi bi-trash me-1"></i>刪除預約
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('bookingDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailModal'));
    modal.show();
    
    document.getElementById('bookingDetailModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// 複製預約資料
function copyBookingDetails(encodedBookingData) {
    try {
        const booking = JSON.parse(decodeURIComponent(encodedBookingData));
        
        let formattedDate = booking[0];
        if (typeof formattedDate !== 'string' || !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(formattedDate);
            if (!isNaN(date.getTime())) {
                formattedDate = formatDate(date);
            }
        }
        
        const text = `
借用日期：${formattedDate}
節次：${booking[5]}
班級：${booking[1]}
任課教師：${booking[2]}
科目/課程：${booking[3]}
設備：${booking[6]}
其他說明：${booking[4] || '無'}
        `.trim();
        
        navigator.clipboard.writeText(text).then(() => {
            showAlert('預約資料已複製到剪貼簿', 'success');
        }).catch(err => {
            showAlert('複製失敗：' + err.message, 'danger');
        });
    } catch (error) {
        showAlert('複製失敗：' + error.message, 'danger');
    }
}

// 確認刪除預約
function confirmDeleteBooking(encodedBookingData, index) {
    try {
        const booking = JSON.parse(decodeURIComponent(encodedBookingData));
        
        let formattedDate = booking[0];
        if (typeof formattedDate !== 'string' || !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(formattedDate);
            if (!isNaN(date.getTime())) {
                formattedDate = formatDate(date);
            }
        }
        
        const confirmMessage = `確定要刪除以下預約記錄嗎？\n\n借用日期：${formattedDate}\n節次：${booking[5]}\n班級：${booking[1]}\n教師：${booking[2]}\n設備：${booking[6]}\n\n※ 此操作將同時刪除試算表記錄和日曆事件，且無法復原！`;
        
        if (confirm(confirmMessage)) {
            deleteBooking(booking, index);
        }
    } catch (error) {
        showAlert('解析預約資料失敗：' + error.message, 'danger');
    }
}

// 刪除預約
async function deleteBooking(booking, index) {
    const deleteBtn = document.querySelector('.btn-danger');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>刪除中...';
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.deleteBooking, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ booking })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('預約記錄已成功刪除！', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailModal'));
            if (modal) {
                modal.hide();
            }
            
            updateBookingsByDate();
            updateGearStatusTable();
        } else {
            showAlert('刪除失敗：' + data.message, 'danger');
            
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i>刪除預約';
            }
        }
    } catch (error) {
        console.error('刪除預約錯誤:', error);
        showAlert('刪除失敗：' + error.message, 'danger');
        
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="bi bi-trash me-1"></i>刪除預約';
        }
    }
}

// 更新設備狀況表格
async function updateGearStatusTable() {
    let booking_date = document.getElementById('booking_date').value;
    
    if (!booking_date) {
        booking_date = formatDate(new Date());
    }
    
    const title = document.getElementById('gear_status_title');
    title.innerHTML = `<i class="bi bi-calendar-day me-2"></i>設備借用狀況 - ${booking_date}`;
    
    const tbody = document.getElementById('gearStatusTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="2" class="text-center text-muted p-4">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                載入中...
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch(API_ENDPOINTS.getGearStatus, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: booking_date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderGearStatusTable(data.gearStatus);
        } else {
            showGearStatusError('載入設備狀況失敗：' + data.message);
        }
    } catch (error) {
        console.error('獲取設備狀況失敗:', error);
        showGearStatusError('載入設備狀況失敗：' + error.message);
    }
}

// 渲染設備狀況表格
function renderGearStatusTable(gearStatusList) {
    const periods = ['第1節', '第2節', '第3節', '第4節', '午休', '第5節', '第6節', '第7節'];
    const visibleGears = gearStatusList.filter(gear => gear.visible);
    
    if (visibleGears.length === 0) {
        showGearStatusError('沒有可顯示的設備');
        return;
    }
    
    const tbody = document.getElementById('gearStatusTableBody');
    let bodyHtml = '';
    
    periods.forEach(period => {
        const borrowedGears = [];
        
        visibleGears.forEach(gear => {
            const isBooked = gear.bookedPeriods.includes(period);
            if (isBooked) {
                const bookingDetail = gear.bookingDetails.find(detail => detail.period === period);
                if (bookingDetail) {
                    borrowedGears.push({
                        gearName: gear.name,
                        className: bookingDetail.className,
                        teacher: bookingDetail.teacher,
                        subject: bookingDetail.subject,
                        description: bookingDetail.description || '',
                        period: period
                    });
                }
            }
        });
        
        bodyHtml += `<tr>`;
        bodyHtml += `<td class="period-cell">${period}</td>`;
        bodyHtml += `<td class="borrowed-gears-cell">`;
        
        if (borrowedGears.length === 0) {
            bodyHtml += `<div class="no-borrowed-gears">
                <i class="bi bi-check-circle text-success me-1"></i>
                該節次無設備借用
            </div>`;
        } else {
            borrowedGears.forEach((gear) => {
                const gearBookingData = {
                    gearName: gear.gearName,
                    className: gear.className,
                    teacher: gear.teacher,
                    subject: gear.subject,
                    period: gear.period
                };
                
                bodyHtml += `
                    <div class="borrowed-gear-item" 
                         style="cursor: pointer;"
                         data-gear-booking='${JSON.stringify(gearBookingData)}'
                         title="設備：${gear.gearName}，班級：${gear.className}，教師：${gear.teacher}，課程：${gear.subject} - 點擊查看詳細資料">
                        <i class="bi bi-tablet me-1"></i>
                        <span class="borrowed-gear-name">${gear.gearName}</span>
                        ${gear.description && gear.description.trim() !== '' ? 
                          `<span class="borrowed-gear-description">${gear.description}</span>` : 
                          ''}
                        <span class="borrowed-gear-details">
                            ${gear.className} - ${gear.teacher}
                        </span>
                    </div>
                `;
            });
        }
        
        bodyHtml += `</td></tr>`;
    });
    
    tbody.innerHTML = bodyHtml;
    
    // 添加點擊事件
    tbody.querySelectorAll('.borrowed-gear-item[data-gear-booking]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const gearBookingData = JSON.parse(this.dataset.gearBooking);
                showGearBookingDetails(gearBookingData);
            } catch (error) {
                console.error('解析設備預約資料失敗:', error);
                showAlert('解析設備預約資料失敗', 'danger');
            }
        });
    });
}

// 顯示設備狀況錯誤
function showGearStatusError(message) {
    const tbody = document.getElementById('gearStatusTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="2" class="text-center text-danger p-4">
                <i class="bi bi-exclamation-triangle me-2"></i>${message}
            </td>
        </tr>
    `;
}

// 載入最近20筆借用記錄
async function loadTop20Bookings() {
    try {
        const response = await fetch(API_ENDPOINTS.getInitData);
        const data = await response.json();
        
        if (data.success && data.top20Bookings) {
            renderAllBookingsTable(data.top20Bookings);
        }
    } catch (error) {
        console.error('載入最近記錄錯誤:', error);
    }
}

// 渲染所有借用記錄表格
function renderAllBookingsTable(bookings) {
    const thead = document.getElementById('allBookingsTableHeader');
    const tbody = document.getElementById('allBookingsTableBody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted p-4">暫無紀錄</td></tr>';
        return;
    }
    
    // 渲染表頭
    let headerHtml = '';
    bookings[0].forEach(header => {
        headerHtml += `<th>${header}</th>`;
    });
    thead.innerHTML = headerHtml;
    
    // 渲染表體
    let bodyHtml = '';
    for (let i = 1; i < bookings.length; i++) {
        bodyHtml += '<tr>';
        for (let j = 0; j < bookings[i].length; j++) {
            let cellData = bookings[i][j];
            
            if (j === 0) { // timestamp
                const timeValue = new Date(cellData);
                cellData = formatDateTime(timeValue);
            } else if (j === 1) { // date
                const timeValue = new Date(cellData);
                cellData = formatDate(timeValue);
            }
            
            bodyHtml += `<td>${cellData}</td>`;
        }
        bodyHtml += '</tr>';
    }
    tbody.innerHTML = bodyHtml;
}

// 格式化日期時間
function formatDateTime(date) {
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const seconds = ('0' + date.getSeconds()).slice(-2);
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 顯示設備預約詳情
async function showGearBookingDetails(gearBookingData) {
    const booking_date = document.getElementById('booking_date').value || formatDate(new Date());
    
    showAlert('正在載入預約詳細資料...', 'info');
    
    try {
        const response = await fetch(API_ENDPOINTS.getBookingsByDate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: booking_date })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const bookings = data.bookings;
            const matchedBooking = bookings.find(booking => {
                return booking[5] === gearBookingData.period &&
                       booking[6] === gearBookingData.gearName &&
                       booking[2] === gearBookingData.teacher &&
                       booking[1] === gearBookingData.className;
            });
            
            if (matchedBooking) {
                const index = bookings.indexOf(matchedBooking);
                showBookingDetails(matchedBooking, index);
                
                const alerts = document.querySelectorAll('.alert');
                alerts.forEach(alert => {
                    if (alert.textContent.includes('正在載入預約詳細資料')) {
                        const bsAlert = new bootstrap.Alert(alert);
                        bsAlert.close();
                    }
                });
            } else {
                showAlert('找不到完整的預約記錄，請到左側預約記錄中查看詳細資料', 'warning');
            }
        } else {
            showAlert('載入設備預約詳細資料失敗：' + data.message, 'danger');
        }
    } catch (error) {
        console.error('查詢預約記錄失敗:', error);
        showAlert('載入設備預約詳細資料失敗：' + error.message, 'danger');
    }
}
