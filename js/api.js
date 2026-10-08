/**
 * PPCH Medical Equipment Tracking & Evaluation System
 * Cloud Sync & API Client for Google Apps Script & LINE Alert
 */

(function (window) {
  var STORAGE_KEY_GAS = 'ppch_med_gas_url';

  var PPCH_API = {
    getEndpoint: function () {
      return (window.PPCH_CONFIG && window.PPCH_CONFIG.defaultGasUrl) || '';
    },

    setEndpoint: function (url) {
      if (window.PPCH_CONFIG) {
        window.PPCH_CONFIG.defaultGasUrl = (url || '').trim();
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
      this.fetchOverview(function (res) {
        if (res && res.success) {
          callback({ success: true, message: 'เชื่อมต่อ Google Apps Script สำเร็จแล้ว!', data: res.data });
        } else {
          callback({ success: false, message: res ? res.message : 'ไม่สามารถเชื่อมต่อได้' });
        }
      });
    },

    // Fetch Full Database Overview (Live Equipment, Evaluations, Transfers) via High-Speed JSONP
    fetchOverview: function (callback) {
      var url = this.getEndpoint();
      if (!url) {
        if (callback) callback({ success: false, message: 'ยังไม่ได้ระบุ Web App URL', data: null });
        return;
      }

      var cbName = 'ppch_overview_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      var script = document.createElement('script');
      var jsonpUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'action=getOverview&callback=' + cbName + '&t=' + Date.now();

      var timer = setTimeout(function () {
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (callback) callback({ success: false, message: 'หมดเวลาการเชื่อมต่อฐานข้อมูล Google Sheets (Timeout)', data: null });
      }, 10000);

      window[cbName] = function (data) {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (data && data.status === 'success' && data.data) {
          if (callback) callback({ success: true, data: data.data, serverTime: data.serverTime });
        } else {
          if (callback) callback({ success: false, message: 'เกิดข้อผิดพลาดในการรับข้อมูลจาก Google Sheets', data: null });
        }
      };

      script.onerror = function () {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        // Fallback to direct fetch
        fetch(url + (url.indexOf('?') === -1 ? '?' : '&') + 'action=getOverview&t=' + Date.now())
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.status === 'success' && res.data) {
              if (callback) callback({ success: true, data: res.data, serverTime: res.serverTime });
            } else {
              if (callback) callback({ success: false, message: 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้', data: null });
            }
          })
          .catch(function (err) {
            if (callback) callback({ success: false, message: err.toString(), data: null });
          });
      };

      script.src = jsonpUrl;
      document.body.appendChild(script);
    },

    // Fetch Evaluations from Google Apps Script
    fetchEvaluations: function (callback) {
      var url = this.getEndpoint();
      if (!url) {
        if (callback) callback({ success: false, message: 'ยังไม่ได้ระบุ Web App URL', data: [] });
        return;
      }

      var cbName = 'ppch_eval_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      var script = document.createElement('script');
      var jsonpUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 'action=getEvaluations&callback=' + cbName + '&t=' + Date.now();

      var timer = setTimeout(function () {
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (callback) callback({ success: false, message: 'หมดเวลาการเชื่อมต่อ (Timeout)', data: [] });
      }, 9000);

      window[cbName] = function (data) {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (data && data.status === 'success' && Array.isArray(data.data)) {
          if (callback) callback({ success: true, data: data.data, serverTime: data.serverTime });
        } else {
          if (callback) callback({ success: false, message: 'เกิดข้อผิดพลาดในการรับข้อมูล', data: [] });
        }
      };

      script.onerror = function () {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (callback) callback({ success: false, message: 'ไม่สามารถโหลดข้อมูลจาก Google Apps Script ได้', data: [] });
      };

      script.src = jsonpUrl;
      document.body.appendChild(script);
    },

    // Post Payload to Google Apps Script
    postToGas: function (payload, callback) {
      var url = this.getEndpoint();
      if (!url) {
        if (callback) callback({ success: false, message: 'No GAS URL configured' });
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      }).then(function () {
        if (callback) callback({ success: true, message: 'ส่งข้อมูลขึ้นฐานข้อมูล Google Sheets สำเร็จ' });
      }).catch(function (err) {
        console.warn('GAS Post Error:', err);
        if (callback) callback({ success: false, message: err.toString() });
      });
    },

    // Submit Evaluation directly to Google Sheets database
    submitEvaluation: function (record, callback) {
      var payload = {
        action: 'submitEvaluation',
        id: record.id || ('EV-' + Date.now()),
        evaluatedAt: record.evaluatedAt,
        formId: record.formId,
        deviceId: record.deviceId,
        deviceAsset: record.deviceAsset,
        deviceName: record.deviceName,
        department: record.department,
        evaluatedBy: record.evaluatedBy,
        result: record.result,
        abnormalNote: record.abnormalNote || '',
        checklist: record.checklist || {},
        upsBatteryRuntime: record.upsBattery ? record.upsBattery.runtimeFormatted : '',
        upsBatteryTested: record.upsBattery ? record.upsBattery.tested : false,
        upsBatteryCycle: record.upsBattery ? record.upsBattery.cycleDate : ''
      };
      this.postToGas(payload, callback);
    },

    // Transfer Equipment directly in Google Sheets database
    transferEquipment: function (transferData, callback) {
      var payload = {
        action: 'transferEquipment',
        deviceId: transferData.deviceId,
        deviceAsset: transferData.deviceAsset,
        deviceName: transferData.deviceName,
        fromDept: transferData.fromDept,
        toDept: transferData.toDept,
        transferredBy: transferData.transferredBy || 'ไม่ระบุ',
        reason: transferData.reason || ''
      };
      this.postToGas(payload, callback);
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

  window.PPCH_API = PPCH_API;
})(window);
