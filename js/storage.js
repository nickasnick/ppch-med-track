/**
 * PPCH Medical Equipment Tracking & Evaluation System
 * State & Storage Manager (LocalStorage + Event Dispatcher)
 */

(function (window) {
  var STORAGE_KEY = window.PPCH_CONFIG.storageKey;
  var TODAY = window.PPCH_CONFIG.todayDate || new Date().toISOString().slice(0, 10);

  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.equipment && parsed.equipment.length > 0) {
          // Sanitize out old mock/dummy evaluations & transfers
          if (Array.isArray(parsed.evaluations)) {
            parsed.evaluations = parsed.evaluations.filter(function (ev) {
              return ev.id && ev.id.indexOf('EV-20260930') === -1 && ev.id.indexOf('EV-1791167475297') === -1;
            });
          }
          if (Array.isArray(parsed.transfers)) {
            parsed.transfers = parsed.transfers.filter(function (tr) {
              return tr.id && tr.id.indexOf('TR-20260929') === -1;
            });
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read error, using fallback seed:', e);
    }

    // Default Seed (100% Clean - No dummy evaluations or transfers)
    var initial = {
      equipment: window.PPCH_CONFIG.initialEquipment,
      evaluations: [],
      transfers: []
    };
    saveData(initial);
    return initial;
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('ppch:data-updated', { detail: data }));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  window.PPCH_STORE = {
    getAll: function () {
      return loadData();
    },

    getEquipment: function () {
      return loadData().equipment;
    },

    getEquipmentById: function (id) {
      var list = loadData().equipment;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id || list[i].assetCode === id) {
          return list[i];
        }
      }
      return null;
    },

    getDepartmentName: function (deptId) {
      var depts = window.PPCH_CONFIG.departments;
      for (var i = 0; i < depts.length; i++) {
        if (depts[i].id === deptId) return depts[i].name;
      }
      return deptId;
    },

    getFormById: function (formId) {
      var forms = window.PPCH_CONFIG.forms;
      for (var i = 0; i < forms.length; i++) {
        if (forms[i].id === formId) return forms[i];
      }
      return null;
    },

    // Record an Evaluation
    submitEvaluation: function (evalPayload) {
      var data = loadData();
      var eq = null;
      var eqIndex = -1;

      for (var i = 0; i < data.equipment.length; i++) {
        if (data.equipment[i].id === evalPayload.deviceId) {
          eq = data.equipment[i];
          eqIndex = i;
          break;
        }
      }

      if (!eq) {
        throw new Error('ไม่พบข้อมูลเครื่องมือรหัส: ' + evalPayload.deviceId);
      }

      var nowStr = evalPayload.evaluatedAt;
      if (!nowStr) {
        try {
          nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');
        } catch (e) {
          var now = new Date();
          nowStr = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) + ' ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
        }
      }
      
      // Update Equipment status
      eq.lastEvaluatedAt = nowStr;
      eq.lastEvaluatedStatus = evalPayload.result; // 'normal' | 'abnormal'
      eq.lastEvaluatedBy = evalPayload.evaluatedBy;
      eq.currentDept = evalPayload.department || eq.currentDept;

      if (evalPayload.result === 'abnormal') {
        eq.status = 'abnormal';
        eq.abnormalReason = evalPayload.abnormalNote || 'พบความผิดปกติจากการตรวจเช็ค';
      } else {
        eq.status = 'ready';
        eq.abnormalReason = '';
      }

      data.equipment[eqIndex] = eq;

      // Add to evaluations list
      var evalRecord = {
        id: 'EV-' + Date.now(),
        deviceId: eq.id,
        deviceAsset: eq.assetCode,
        deviceName: eq.name,
        formId: evalPayload.formId,
        department: eq.currentDept,
        evaluatedBy: evalPayload.evaluatedBy,
        evaluatedAt: nowStr,
        result: evalPayload.result,
        abnormalNote: evalPayload.abnormalNote || '',
        checklist: evalPayload.checklist || {}
      };

      data.evaluations.unshift(evalRecord);
      saveData(data);
      window.dispatchEvent(new CustomEvent('ppch:evaluation-submitted', { detail: { record: evalRecord, equipment: eq } }));
      return { success: true, record: evalRecord, equipment: eq };
    },

    // Transfer Custody (e.g. Dept A -> Dept B or Central -> Dept)
    transferEquipment: function (deviceId, toDeptId, transferredBy, reason) {
      var data = loadData();
      var eq = null;
      var eqIndex = -1;

      for (var i = 0; i < data.equipment.length; i++) {
        if (data.equipment[i].id === deviceId) {
          eq = data.equipment[i];
          eqIndex = i;
          break;
        }
      }

      if (!eq) {
        throw new Error('ไม่พบเครื่องมือแพทย์รหัส ' + deviceId);
      }

      var oldDept = eq.currentDept;
      var nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');

      // Update current department (Custody transferred!)
      eq.currentDept = toDeptId;
      data.equipment[eqIndex] = eq;

      var transferLog = {
        id: 'TR-' + Date.now(),
        deviceId: eq.id,
        deviceAsset: eq.assetCode,
        deviceName: eq.name,
        fromDept: oldDept,
        toDept: toDeptId,
        transferredBy: transferredBy || 'ไม่ระบุ',
        transferredAt: nowStr,
        reason: reason || 'ย้ายไปใช้งานที่แผนกใหม่'
      };

      data.transfers.unshift(transferLog);
      saveData(data);
      window.dispatchEvent(new CustomEvent('ppch:transfer-recorded', { detail: { transfer: transferLog, equipment: eq } }));
      return { success: true, transfer: transferLog, equipment: eq };
    },

    // Mark as repaired/cleared by Admin
    resolveAbnormal: function (deviceId, resolvedBy, note) {
      var data = loadData();
      for (var i = 0; i < data.equipment.length; i++) {
        if (data.equipment[i].id === deviceId) {
          data.equipment[i].status = 'ready';
          data.equipment[i].lastEvaluatedStatus = 'normal';
          data.equipment[i].abnormalReason = '';
          break;
        }
      }
      saveData(data);
    },

    // Get List of Overdue Equipment (Crucial requirement!)
    getOverdueEquipment: function (freqFilter) {
      var data = loadData();
      var overdueList = [];
      var curMonth = TODAY.slice(0, 7); // '2026-09'

      data.equipment.forEach(function (eq) {
        // Skip machines under central or in maintenance if not required
        var isDaily = (eq.frequency === 'daily');
        var isMonthly = (eq.frequency === 'monthly');

        if (freqFilter === 'daily' && !isDaily) return;
        if (freqFilter === 'monthly' && !isMonthly) return;

        var hasEvaluated = false;
        if (eq.lastEvaluatedAt) {
          if (isDaily && eq.lastEvaluatedAt.indexOf(TODAY) === 0) {
            hasEvaluated = true;
          } else if (isMonthly && eq.lastEvaluatedAt.indexOf(curMonth) === 0) {
            hasEvaluated = true;
          }
        }

        if (!hasEvaluated) {
          overdueList.push({
            equipment: eq,
            currentDept: eq.currentDept,
            currentDeptName: window.PPCH_STORE.getDepartmentName(eq.currentDept),
            homeDept: eq.homeDept,
            homeDeptName: window.PPCH_STORE.getDepartmentName(eq.homeDept),
            frequency: eq.frequency,
            lastChecked: eq.lastEvaluatedAt || 'ยังไม่เคยประเมิน'
          });
        }
      });

      return overdueList;
    },

    // Get Abnormal alerts
    getAbnormalEquipment: function () {
      var data = loadData();
      return data.equipment.filter(function (eq) {
        return eq.status === 'abnormal' || eq.lastEvaluatedStatus === 'abnormal';
      });
    },

    // Reset seed data
    resetSeed: function () {
      localStorage.removeItem(STORAGE_KEY);
      return loadData();
    }
  };
})(window);
