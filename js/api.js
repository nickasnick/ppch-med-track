/**
 * PPCH Medical Equipment Tracking & Evaluation System
 * Cloud Sync & API Client for Google Apps Script & LINE Alert
 */

(function (window) {
  var STORAGE_KEY_GAS = 'ppch_med_gas_url';

  var PPCH_API = {
    getEndpoint: function () {
      return localStorage.getItem(STORAGE_KEY_GAS) || '';
    },

    setEndpoint: function (url) {
      if (url) {
        localStorage.setItem(STORAGE_KEY_GAS, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_GAS);
      }
    },

    isConfigured: function () {
      var url = this.getEndpoint();
      return url && url.indexOf('script.google.com') !== -1;
    },

    // Test Connection
    testConnection: function (callback) {
      var url = this.getEndpoint();
      if (!url) {
        callback({ success: false, message: 'ยังไม่ได้ระบุ Web App URL ของ Google Apps Script' });
        return;
      }

      var testUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'action=getOverview&t=' + Date.now();
      fetch(testUrl, { method: 'GET', mode: 'cors' })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.status === 'success') {
            callback({ success: true, message: 'เชื่อมต่อ Google Apps Script สำเร็จแล้ว!', data: data });
          } else {
            callback({ success: false, message: 'การตอบกลับจากระบบไม่สมบูรณ์: ' + JSON.stringify(data) });
          }
        })
        .catch(function (err) {
          // Try JSONP fallback if CORS restriction
          PPCH_API.testConnectionJsonp(url, callback);
        });
    },

    testConnectionJsonp: function (url, callback) {
      var cbName = 'ppch_cb_' + Date.now();
      var script = document.createElement('script');
      var fullUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'action=getOverview&callback=' + cbName;

      var timer = setTimeout(function () {
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        callback({ success: false, message: 'การเชื่อมต่อหมดเวลา (Timeout) กรุณาตรวจสอบสิทธิ์ Web App (ต้องตั้งเป็น Anyone)' });
      }, 8000);

      window[cbName] = function (data) {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (data && data.status === 'success') {
          callback({ success: true, message: 'เชื่อมต่อ Google Apps Script ผ่าน JSONP สำเร็จแล้ว!', data: data });
        } else {
          callback({ success: false, message: 'เกิดข้อผิดพลาดในการรับข้อมูล' });
        }
      };

      script.src = fullUrl;
      document.body.appendChild(script);
    },

    // Post to Google Apps Script
    postToGas: function (payload, callback) {
      var url = this.getEndpoint();
      if (!url) {
        if (callback) callback({ success: false, message: 'No GAS URL configured (Running in local persistence mode)' });
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Safe for GAS doPost
      }).then(function () {
        if (callback) callback({ success: true, message: 'ส่งข้อมูลขึ้น Google Apps Script สำเร็จ' });
      }).catch(function (err) {
        console.warn('GAS Post Error:', err);
        if (callback) callback({ success: false, message: err.toString() });
      });
    },

    // Test LINE Alert directly via GAS
    testLineAlert: function (callback) {
      var url = this.getEndpoint();
      if (!url) {
        if (callback) callback({ success: false, message: 'ยังไม่ได้ระบุ Web App URL ของ Google Apps Script' });
        return;
      }
      this.postToGas({ action: 'testLine' }, function (res) {
        if (callback) callback(res);
      });
    }
  };

  // Auto-hook into PPCH_STORE custom events
  window.addEventListener('ppch:evaluation-submitted', function (e) {
    if (PPCH_API.isConfigured() && e.detail) {
      var record = e.detail.record;
      var payload = {
        action: 'submitEvaluation',
        deviceId: record.deviceId,
        deviceAsset: record.deviceAsset,
        deviceName: record.deviceName,
        department: record.department,
        evaluatedBy: record.evaluatedBy,
        result: record.result,
        abnormalNote: record.abnormalNote,
        checklist: record.checklist
      };
      PPCH_API.postToGas(payload);
    }
  });

  window.addEventListener('ppch:transfer-recorded', function (e) {
    if (PPCH_API.isConfigured() && e.detail) {
      var tr = e.detail.transfer;
      var payload = {
        action: 'transferEquipment',
        deviceId: tr.deviceId,
        deviceAsset: tr.deviceAsset,
        deviceName: tr.deviceName,
        fromDept: tr.fromDept,
        toDept: tr.toDept,
        transferredBy: tr.transferredBy,
        reason: tr.reason
      };
      PPCH_API.postToGas(payload);
    }
  });

  window.PPCH_API = PPCH_API;
})(window);
