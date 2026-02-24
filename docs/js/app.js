/**
 * 主應用程式邏輯
 */

// 全局變數
let currentUserEmail = '';
let isAdmin = false;

// 初始化應用程式
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化日期選擇器
        initializeDatePickers();
        
        // 立即載入節次（不等待，硬編碼資料瞬間顯示）
        loadPeriods();
        
        // 並行執行所有 API 調用，不用一個等一個！
        await Promise.all([
            loadUserInfo(),
            loadGears(),
            loadTodayBookings(),
            updateGearStatusTable()
        ]);
        
        // 設定事件監聽器（在所有資料載入後）
        setupEventListeners();
        
    } catch (error) {
        console.error('初始化錯誤:', error);
        showAlert('系統初始化失敗: ' + error.message, 'danger');
    }
});

/**
 * 初始化日期選擇器
 */
function initializeDatePickers() {
    const today = new Date();
    const todayString = formatDate(today);
    
    // 計算30天後
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30);
    const maxDateString = formatDate(maxDate);
    
    // 設定左側日期選擇器
    const dateInput = document.getElementById('booking_date');
    dateInput.min = todayString;
    dateInput.max = maxDateString;
    dateInput.value = todayString;
    
    // 設定右側日期選擇器
    const viewDateInput = document.getElementById('view_booking_date');
    viewDateInput.min = todayString;
    viewDateInput.max = maxDateString;
    viewDateInput.value = todayString;
}

/**
 * 載入用戶資訊
 */
async function loadUserInfo() {
    try {
        const response = await apiClient.getUserInfo();
        currentUserEmail = response.email;
        isAdmin = response.isAdmin || false;
        
        // 顯示用戶郵箱和後端版本
        const version = response.version || 'unknown';
        const lastUpdate = response.lastUpdate || '';
        document.getElementById('userEmail').textContent = 
            `${currentUserEmail} | 後端版本: ${version}`;
        
        // 在 Console 輸出版本資訊以便確認
        console.log('===================');
        console.log('後端 API 版本:', version);
        console.log('最後更新:', lastUpdate);
        console.log('===================');
        
        // 更新試算表連結
        const sheetId = response.sheetId || API_CONFIG.SHEET_ID;
        document.getElementById('openSpreadsheetLink').href = 
            `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
            
    } catch (error) {
        console.error('載入用戶資訊失敗:', error);
        document.getElementById('userEmail').textContent = '未登入';
    }
}

/**
 * 載入設備列表
 */
async function loadGears() {
    try {
        const response = await apiClient.getGears();
        const gears = response.gears || [];
        
        const container = document.getElementById('gearContainer');
        container.innerHTML = '';
        
        gears.forEach(gear => {
            if (gear.visible) {
                const html = `
                    <div class="col-12 mb-2 gear-item" data-gear="${gear.title}">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="gearRadio" 
                                   id="gear_${gear.id}" value="${gear.title}">
                            <label class="form-check-label" for="gear_${gear.id}">
                                <strong>${gear.title}</strong>
                                ${gear.descript ? `<br><small class="text-muted">${gear.descript}</small>` : ''}
                            </label>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            }
        });
        
    } catch (error) {
        console.error('載入設備失敗:', error);
        showAlert('載入設備列表失敗', 'danger');
    }
}

/**
 * 載入節次列表（硬編碼版本 - 瞬間顯示，不需要 API 調用）
 */
function loadPeriods() {
    try {
        // 硬編碼節次資料，不需要調用 API，瞬間顯示
        const periods = [
            { id: 1, name: '第1節' },
            { id: 2, name: '第2節' },
            { id: 3, name: '第3節' },
            { id: 4, name: '第4節' },
            { id: 5, name: '午休' },
            { id: 6, name: '第5節' },
            { id: 7, name: '第6節' },
            { id: 8, name: '第7節' }
        ];
        
        const container = document.getElementById('periodsContainer');
        container.innerHTML = '';
        
        periods.forEach(period => {
            const html = `
                <div class="col-lg-4 col-md-6 col-sm-6 mb-2">
                    <div class="form-check">
                        <input class="form-check-input period-checkbox" type="checkbox" 
                               id="${period.id}" value="${period.name}">
                        <label class="form-check-label" for="${period.id}">
                            ${period.name}
                        </label>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
        
    } catch (error) {
        console.error('載入節次失敗:', error);
        showAlert('載入節次列表失敗', 'danger');
    }
}

/**
 * 載入今日借用記錄
 */
async function loadTodayBookings() {
    const today = formatDate(new Date());
    await loadBookingsByDate(today);
}

/**
 * 載入特定日期的借用記錄
 */
async function loadBookingsByDate(date) {
    try {
        const response = await apiClient.getBookingsByDate(date);
        const bookings = response.bookings || [];
        
        // 更新標題
        document.getElementById('bookings_title').innerHTML = 
            `<i class="bi bi-calendar-check me-2"></i>${date} 借用紀錄`;
        
        const tbody = document.querySelector('#bookingsTable tbody');
        tbody.innerHTML = '';
        
        if (bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted p-4">
                        <i class="bi bi-inbox me-2"></i>當天無借用紀錄
                    </td>
                </tr>
            `;
        } else {
            bookings.forEach((booking, index) => {
                const row = createBookingRow(booking, index);
                tbody.appendChild(row);
            });
        }
        
    } catch (error) {
        console.error('載入借用記錄失敗:', error);
        showAlert('載入借用記錄失敗', 'danger');
    }
}

/**
 * 創建借用記錄行
 */
function createBookingRow(booking, index) {
    const row = document.createElement('tr');
    row.className = 'booking-row';
    row.style.cursor = 'pointer';
    row.dataset.booking = JSON.stringify(booking);
    row.dataset.index = index;
    
    // 欄位: 日期, 節次(班級), 教師, 課程, 設備
    const cells = [
        booking.date,
        `${booking.period} (${booking.className})`,
        booking.teacher,
        booking.subject,
        booking.gear
    ];
    
    cells.forEach(cellData => {
        const td = document.createElement('td');
        td.className = 'text-truncate';
        td.style.maxWidth = '150px';
        td.title = cellData;
        td.textContent = cellData;
        row.appendChild(td);
    });
    
    // 添加點擊事件
    row.addEventListener('click', () => {
        showBookingDetails(booking, index);
    });
    
    return row;
}

/**
 * 載入所有借用記錄 (已移除)
 * 功能已改為直接開啟 Google 試算表
 */
// async function loadAllBookings() {
//     功能已移除
// }

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 表單提交
    document.getElementById('myForm').addEventListener('submit', handleFormSubmit);
    
    // 日期變更
    document.getElementById('booking_date').addEventListener('change', function() {
        document.getElementById('view_booking_date').value = this.value;
        loadBookingsByDate(this.value);
        checkGearAvailability();
        updateGearStatusTable(this.value);
    });
    
    document.getElementById('view_booking_date').addEventListener('change', function() {
        const date = this.value;
        loadBookingsByDate(date);
        updateGearStatusTable(date);
    });
    
    // 節次變更
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('period-checkbox')) {
            checkGearAvailability();
        }
    });
    
    // 其他設備選項
    document.addEventListener('change', function(e) {
        if (e.target.name === 'gearRadio') {
            const otherInput = document.getElementById('otherGearInput');
            if (e.target.value === 'other') {
                otherInput.style.display = 'block';
            } else {
                otherInput.style.display = 'none';
            }
        }
    });
}

/**
 * 處理表單提交
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // 驗證日期
    if (!validateDateRange()) {
        return;
    }
    
    // 收集表單數據
    const bookingData = collectFormData();
    
    if (!bookingData) {
        return; // 驗證失敗
    }
    
    // 顯示載入狀態
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>提交中...';
    
    try {
        await apiClient.submitBooking(bookingData);
        
        showAlert('新增成功！已同步到日曆系統。', 'success');
        
        // 清空表單
        document.getElementById('myForm').reset();
        document.getElementById('otherGearInput').style.display = 'none';
        resetGearAvailability();
        
        // 重新設定日期
        document.getElementById('booking_date').value = bookingData.date;
        document.getElementById('view_booking_date').value = bookingData.date;
        
        // 重新載入數據
        await loadBookingsByDate(bookingData.date);
        await updateGearStatusTable(bookingData.date);
        
    } catch (error) {
        console.error('提交失敗:', error);
        showAlert('新增失敗：' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * 收集表單數據
 */
function collectFormData() {
    const date = document.getElementById('booking_date').value;
    const className = document.getElementById('selected_className').value;
    const teacher = document.getElementById('teacherName').value;
    const subject = document.getElementById('classSubject').value;
    const description = document.getElementById('descript').value;
    
    // 收集選中的節次
    const periods = Array.from(document.querySelectorAll('.period-checkbox:checked'))
        .map(cb => cb.value);
    
    if (periods.length === 0) {
        showAlert('請至少選擇一個節次！', 'danger');
        return null;
    }
    
    // 收集選中的設備
    const selectedRadio = document.querySelector('input[name="gearRadio"]:checked');
    let gear;
    
    if (!selectedRadio) {
        showAlert('必須選擇要借的設備！', 'danger');
        return null;
    }
    
    if (selectedRadio.value === 'other') {
        gear = document.querySelector('#otherGearInput input').value.trim();
        if (!gear) {
            showAlert('請輸入其他設備名稱！', 'danger');
            return null;
        }
    } else {
        gear = selectedRadio.value;
    }
    
    return {
        date,
        className,
        teacher,
        subject,
        description,
        periods,
        gear
    };
}

/**
 * 驗證日期範圍
 */
function validateDateRange() {
    const dateInput = document.getElementById('booking_date');
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
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

/**
 * 檢查設備可用性
 */
async function checkGearAvailability() {
    const date = document.getElementById('booking_date').value;
    const periods = Array.from(document.querySelectorAll('.period-checkbox:checked'))
        .map(cb => cb.value);
    
    if (!date || periods.length === 0) {
        resetGearAvailability();
        updateAvailabilityInfo('請先選擇日期和節次來檢查設備可用性');
        return;
    }
    
    updateAvailabilityInfo('檢查設備可用性中...');
    
    try {
        const response = await apiClient.checkGearAvailability(date, periods);
        const availableGears = response.gears || [];
        
        updateGearAvailability(availableGears);
        
        const unavailableCount = availableGears.filter(g => !g.available).length;
        if (unavailableCount > 0) {
            updateAvailabilityInfo(`${unavailableCount} 項設備在選定時間已被借用`);
        } else {
            updateAvailabilityInfo('所有設備在選定時間皆可借用');
        }
        
    } catch (error) {
        console.error('檢查設備可用性失敗:', error);
        updateAvailabilityInfo('檢查設備可用性失敗');
    }
}

/**
 * 更新設備可用性顯示
 */
function updateGearAvailability(availableGears) {
    const gearItems = document.querySelectorAll('.gear-item');
    
    gearItems.forEach(item => {
        const gearName = item.dataset.gear;
        const gearInfo = availableGears.find(g => g.name === gearName);
        const input = item.querySelector('input');
        const label = item.querySelector('label');
        
        if (!item.dataset.originalLabel) {
            item.dataset.originalLabel = label.innerHTML;
        }
        
        if (gearInfo && !gearInfo.available) {
            item.classList.add('gear-unavailable');
            input.disabled = true;
            if (input.checked) {
                input.checked = false;
            }
            label.innerHTML = item.dataset.originalLabel.replace(
                /<\/strong>$/, 
                ' <span class="text-danger">(已借用)</span></strong>'
            );
        } else {
            item.classList.remove('gear-unavailable');
            input.disabled = false;
            label.innerHTML = item.dataset.originalLabel;
        }
    });
}

/**
 * 重置設備可用性
 */
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

/**
 * 更新可用性提示訊息
 */
function updateAvailabilityInfo(message) {
    const info = document.getElementById('availabilityInfo');
    info.innerHTML = '<i class="bi bi-info-circle me-1"></i>' + message;
}

function formatDateWithWeekday(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return `${dateString}（${weekdays[d.getDay()]}）`;
}

/**
 * 更新設備狀況表格
 */
async function updateGearStatusTable(dateOverride) {
    let date = dateOverride || document.getElementById('view_booking_date').value || document.getElementById('booking_date').value;
    
    if (!date) {
        date = formatDate(new Date());
    }
    
    // 更新標題
    document.getElementById('gear_status_title').innerHTML = 
        `<i class="bi bi-calendar-day me-2"></i>設備借用狀況 - ${formatDateWithWeekday(date)}`;
    
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
        const response = await apiClient.getGearStatusForDate(date);
        const gearStatusList = response.gearStatus || [];
        
        renderGearStatusTable(gearStatusList);
        
    } catch (error) {
        console.error('載入設備狀況失敗:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-danger p-4">
                    載入設備狀況失敗
                </td>
            </tr>
        `;
    }
}

/**
 * 渲染設備狀況表格
 */
function renderGearStatusTable(gearStatusList) {
    const periods = ['第1節', '第2節', '第3節', '第4節', '午休', '第5節', '第6節', '第7節'];
    const tbody = document.getElementById('gearStatusTableBody');
    
    const visibleGears = gearStatusList.filter(g => g.visible);
    
    if (visibleGears.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-center text-muted p-4">
                    沒有可顯示的設備
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    periods.forEach(period => {
        html += '<tr>';
        html += `<td class="period-cell">${period}</td>`;
        html += '<td class="borrowed-gears-cell">';
        
        const borrowedGears = [];
        visibleGears.forEach(gear => {
            const detailsForPeriod = gear.bookingDetails.filter(d => d.period === period);
            detailsForPeriod.forEach(detail => {
                borrowedGears.push({
                    gearName: gear.name,
                    ...detail
                });
            });
        });
        
        if (borrowedGears.length === 0) {
            html += `
                <div class="no-borrowed-gears">
                    <i class="bi bi-check-circle text-success me-1"></i>
                    該節次無設備借用
                </div>
            `;
        } else {
            borrowedGears.forEach(gear => {
                html += `
                    <div class="borrowed-gear-item" style="cursor: pointer;">
                        <span class="borrowed-gear-name">${gear.gearName}</span>
                        ${gear.description ? `<span class="borrowed-gear-description">${gear.description}</span>` : ''}
                        <span class="borrowed-gear-details">
                            ${gear.className} - ${gear.teacher}
                        </span>
                    </div>
                `;
            });
        }
        
        html += '</td>';
        html += '</tr>';
    });
    
    tbody.innerHTML = html;
}

/**
 * 顯示借用詳細資料
 */
function showBookingDetails(booking, index) {
    const isAdminUser = isAdmin;
    
    const modalHtml = `
        <div class="modal fade" id="bookingDetailModal" tabindex="-1">
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
                                                <td class="fw-bold text-muted">借用日期：</td>
                                                <td>${booking.date}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">節次：</td>
                                                <td><span class="badge bg-primary">${booking.period}</span></td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">班級：</td>
                                                <td><span class="badge bg-success">${booking.className}</span></td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">設備：</td>
                                                <td><span class="badge bg-warning text-dark">${booking.gear}</span></td>
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
                                                <td class="fw-bold text-muted">任課教師：</td>
                                                <td>${booking.teacher}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">科目/課程：</td>
                                                <td>${booking.subject}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold text-muted">其他說明：</td>
                                                <td>${booking.description || '<span class="text-muted">無</span>'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${booking.timestamp ? `
                        <div class="row g-3 mt-2">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h6 class="card-title mb-0">
                                            <i class="bi bi-gear me-1"></i>系統資訊
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <small class="text-muted">
                                            <i class="bi bi-clock me-1"></i>建立時間：${booking.timestamp}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>關閉
                        </button>
                        ${isAdminUser ? `
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteBooking('${encodeURIComponent(JSON.stringify(booking))}')">
                            <i class="bi bi-trash me-1"></i>刪除預約
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除現有 modal
    const existingModal = document.getElementById('bookingDetailModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新 modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailModal'));
    modal.show();
    
    // 清理
    document.getElementById('bookingDetailModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * 確認刪除預約
 */
async function confirmDeleteBooking(encodedBooking) {
    try {
        const booking = JSON.parse(decodeURIComponent(encodedBooking));
        
        if (!confirm(`確定要刪除以下預約記錄嗎？\n\n日期：${booking.date}\n節次：${booking.period}\n班級：${booking.className}\n教師：${booking.teacher}\n設備：${booking.gear}\n\n此操作無法復原！`)) {
            return;
        }
        
        await apiClient.deleteBooking(booking);
        
        showAlert('預約記錄已成功刪除！', 'success');
        
        // 關閉 modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailModal'));
        if (modal) {
            modal.hide();
        }
        
        // 重新載入數據
        const date = document.getElementById('view_booking_date').value || document.getElementById('booking_date').value;
        await loadBookingsByDate(date);
        await updateGearStatusTable(date);
        
    } catch (error) {
        console.error('刪除失敗:', error);
        showAlert('刪除失敗：' + error.message, 'danger');
    }
}

/**
 * 顯示提示訊息
 */
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    container.innerHTML = alertHtml;
    
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
