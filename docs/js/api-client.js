/**
 * Google Apps Script API 客戶端
 * 處理所有與後端 API 的通訊
 */

class GASApiClient {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.requestId = 0;
    }

    /**
     * 發送 GET 請求到 API
     */
    async get(action, params = {}) {
        try {
            const url = new URL(this.apiUrl);
            url.searchParams.append('action', action);
            
            // 添加其他參數
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            const response = await fetch(url.toString(), {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    }

    /**
     * 發送 POST 請求到 API
     */
    async post(action, data = {}) {
        try {
            const payload = {
                action: action,
                ...data
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    }

    // === 設備相關 API ===
    
    /**
     * 獲取所有設備列表
     */
    async getGears() {
        return await this.get('getGears');
    }

    /**
     * 檢查特定日期和節次的設備可用性
     */
    async checkGearAvailability(date, periods) {
        return await this.post('checkGearAvailability', {
            date: date,
            periods: periods
        });
    }

    // === 節次相關 API ===
    
    /**
     * 獲取所有節次列表
     */
    async getPeriods() {
        return await this.get('getPeriods');
    }

    // === 借用記錄相關 API ===
    
    /**
     * 獲取特定日期的借用記錄
     */
    async getBookingsByDate(date) {
        return await this.get('getBookingsByDate', { date: date });
    }

    /**
     * 獲取最近的借用記錄
     */
    async getRecentBookings(limit = 20) {
        return await this.get('getRecentBookings', { limit: limit });
    }

    /**
     * 提交新的借用申請
     */
    async submitBooking(bookingData) {
        return await this.post('submitBooking', bookingData);
    }

    /**
     * 刪除借用記錄 (僅管理員)
     */
    async deleteBooking(booking) {
        return await this.post('deleteBooking', { booking: booking });
    }

    // === 設備狀況相關 API ===
    
    /**
     * 獲取特定日期的設備狀況
     */
    async getGearStatusForDate(date) {
        return await this.get('getGearStatusForDate', { date: date });
    }

    // === 用戶相關 API ===
    
    /**
     * 獲取當前用戶資訊
     */
    async getUserInfo() {
        return await this.get('getUserInfo');
    }

    /**
     * 獲取試算表 ID
     */
    async getSheetId() {
        return await this.get('getSheetId');
    }
}

// 創建全局 API 客戶端實例
const apiClient = new GASApiClient(API_CONFIG.API_URL);
