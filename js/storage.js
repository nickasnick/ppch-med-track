/**
 * PPCH Medical Equipment Tracking & Evaluation System
 * Pure In-Memory Runtime State & Data Manager (Database-Driven, ZERO LocalStorage)
 */

(function (window) {
  // Purge any legacy localStorage keys to ensure complete absence of local machine caching
  try {
    if (window.PPCH_CONFIG && window.PPCH_CONFIG.storageKey) {
      localStorage.removeItem(window.PPCH_CONFIG.storageKey);
    }
    localStorage.removeItem('ppch_medical_equipment_data_v2');
    localStorage.removeItem('ppch_med_track_v1');
    localStorage.removeItem('ppch_med_gas_url');
  } catch (e) {}

  // Pure in-memory state for current browser session (Populated directly from Google Sheets API)
  var inMemoryData = {
    equipment: (window.PPCH_CONFIG && window.PPCH_CONFIG.initialEquipment) ? JSON.parse(JSON.stringify(window.PPCH_CONFIG.initialEquipment)) : [],
    evaluations: [],
    transfers: [],
    repairs: []
  };

  function notifyUpdated() {
    window.dispatchEvent(new CustomEvent('ppch:data-updated', { detail: inMemoryData }));
  }

  window.PPCH_STORE = {
    // Initialize or refresh live data directly from Google Apps Script / Google Sheets
    initFromCloud: function (cloudData) {
      if (!cloudData) return inMemoryData;

      if (Array.isArray(cloudData.equipment) && cloudData.equipment.length > 0) {
        inMemoryData.equipment = cloudData.equipment;
      }
      if (Array.isArray(cloudData.evaluations)) {
        inMemoryData.evaluations = cloudData.evaluations;
        cloudData.evaluations.forEach(function (ev) {
          if (!ev) return;
          for (var i = 0; i < inMemoryData.equipment.length; i++) {
            var item = inMemoryData.equipment[i];
            if ((ev.deviceId && item.id === ev.deviceId) || (ev.deviceAsset && item.assetCode === ev.deviceAsset)) {
              if (ev.result === 'abnormal') {
                item.status = 'abnormal';
                item.abnormalReason = ev.abnormalNote || item.abnormalReason || 'พบข้อบกพร่องจากการตรวจเช็ค';
                item.repairStatus = item.repairStatus || 'reported';
                item.repairReportedAt = item.repairReportedAt || ev.evaluatedAt;
                item.repairReportedBy = item.repairReportedBy || ev.evaluatedBy;
              }
              if (!item.lastEvaluatedAt || ev.evaluatedAt > item.lastEvaluatedAt) {
                item.lastEvaluatedAt = ev.evaluatedAt;
                item.lastEvaluatedBy = ev.evaluatedBy;
              }
              break;
            }
          }
        });
      } else {
        inMemoryData.evaluations = [];
      }
      if (Array.isArray(cloudData.transfers)) {
        inMemoryData.transfers = cloudData.transfers;
      } else {
        inMemoryData.transfers = [];
      }

      notifyUpdated();
      return inMemoryData;
    },

    syncCloudEvaluations: function (cloudEvals) {
      if (!Array.isArray(cloudEvals)) return inMemoryData.evaluations;
      inMemoryData.evaluations = cloudEvals;
      cloudEvals.forEach(function (ev) {
        if (!ev) return;
        for (var i = 0; i < inMemoryData.equipment.length; i++) {
          var eq = inMemoryData.equipment[i];
          if ((ev.deviceId && eq.id === ev.deviceId) || (ev.deviceAsset && eq.assetCode === ev.deviceAsset)) {
            if (ev.result === 'abnormal') {
              eq.status = 'abnormal';
              eq.abnormalReason = ev.abnormalNote || 'พบข้อบกพร่องจากการตรวจเช็ค';
              eq.repairStatus = 'reported';
              eq.repairReportedAt = ev.evaluatedAt;
              eq.repairReportedBy = ev.evaluatedBy;
            } else if (eq.status !== 'in_progress' && eq.status !== 'abnormal') {
              eq.status = 'ready';
            }
            if (!eq.lastEvaluatedAt || ev.evaluatedAt > eq.lastEvaluatedAt) {
              eq.lastEvaluatedAt = ev.evaluatedAt;
              eq.lastEvaluatedBy = ev.evaluatedBy;
            }
            break;
          }
        }
      });
      notifyUpdated();
      return inMemoryData.evaluations;
    },

    getAll: function () {
      return inMemoryData;
    },

    getEquipment: function () {
      return inMemoryData.equipment || [];
    },

    getEvaluations: function () {
      return inMemoryData.evaluations || [];
    },

    getTransfers: function () {
      return inMemoryData.transfers || [];
    },

    getEquipmentById: function (id) {
      var list = inMemoryData.equipment || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id || list[i].assetCode === id) {
          return list[i];
        }
      }
      return null;
    },

    getDepartmentName: function (deptId) {
      var depts = (window.PPCH_CONFIG && window.PPCH_CONFIG.departments) || [];
      for (var i = 0; i < depts.length; i++) {
        if (depts[i].id === deptId) return depts[i].name;
      }
      return deptId;
    },

    getFormById: function (formId) {
      var forms = (window.PPCH_CONFIG && window.PPCH_CONFIG.forms) || [];
      for (var i = 0; i < forms.length; i++) {
        if (forms[i].id === formId) return forms[i];
      }
      return null;
    },

    // Record an Evaluation in memory (for immediate session responsiveness)
    recordEvaluation: function (evalPayload) {
      return this.submitEvaluation(evalPayload);
    },

    submitEvaluation: function (evalPayload) {
      var eq = null;
      var eqIndex = -1;

      for (var i = 0; i < inMemoryData.equipment.length; i++) {
        if (inMemoryData.equipment[i].id === evalPayload.deviceId || inMemoryData.equipment[i].assetCode === evalPayload.deviceAsset) {
          eq = inMemoryData.equipment[i];
          eqIndex = i;
          break;
        }
      }

      var nowStr = evalPayload.evaluatedAt || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');

      if (eq) {
        eq.lastEvaluatedAt = nowStr;
        eq.lastEvaluatedStatus = evalPayload.result;
        eq.lastEvaluatedBy = evalPayload.evaluatedBy;
        eq.currentDept = evalPayload.department || eq.currentDept;

        if (evalPayload.result === 'abnormal') {
          eq.status = 'abnormal';
          eq.abnormalReason = evalPayload.abnormalNote || 'พบข้อบกพร่องจากการตรวจเช็ค';
          eq.repairStatus = 'reported';
          eq.repairReportedAt = nowStr;
          eq.repairReportedBy = evalPayload.evaluatedBy;
        } else {
          eq.status = 'ready';
          eq.abnormalReason = '';
          eq.repairStatus = 'ready';
        }

        if (evalPayload.upsBattery && evalPayload.upsBattery.tested) {
          eq.lastBatteryTestedAt = nowStr;
          eq.lastBatteryRuntime = evalPayload.upsBattery.runtimeFormatted;
          eq.lastBatteryStatus = evalPayload.upsBattery.status || 'normal';
        }

        inMemoryData.equipment[eqIndex] = eq;
      }

      var evalRecord = {
        id: evalPayload.id || ('EV-' + Date.now()),
        deviceId: eq ? eq.id : evalPayload.deviceId,
        deviceAsset: eq ? eq.assetCode : evalPayload.deviceAsset,
        deviceName: eq ? eq.name : evalPayload.deviceName,
        formId: evalPayload.formId,
        department: eq ? eq.currentDept : evalPayload.department,
        evaluatedBy: evalPayload.evaluatedBy,
        evaluatedAt: nowStr,
        result: evalPayload.result,
        abnormalNote: evalPayload.abnormalNote || '',
        checklist: evalPayload.checklist || {},
        upsBattery: evalPayload.upsBattery || null
      };

      inMemoryData.evaluations.unshift(evalRecord);
      notifyUpdated();
      return { success: true, record: evalRecord, equipment: eq };
    },

    transferEquipment: function (deviceId, toDeptId, transferredBy, reason) {
      var eq = null;
      for (var i = 0; i < inMemoryData.equipment.length; i++) {
        if (inMemoryData.equipment[i].id === deviceId) {
          eq = inMemoryData.equipment[i];
          break;
        }
      }
      if (!eq) throw new Error('ไม่พบเครื่องมือแพทย์รหัส ' + deviceId);

      var oldDept = eq.currentDept;
      var nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');
      eq.currentDept = toDeptId;

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

      inMemoryData.transfers.unshift(transferLog);
      notifyUpdated();
      return { success: true, transfer: transferLog, equipment: eq };
    },

    acknowledgeDefect: function (deviceId, ackBy) {
      var eq = null;
      for (var i = 0; i < inMemoryData.equipment.length; i++) {
        if (inMemoryData.equipment[i].id === deviceId) {
          eq = inMemoryData.equipment[i];
          break;
        }
      }
      if (!eq) throw new Error('ไม่พบเครื่องมือแพทย์รหัส: ' + deviceId);

      var nowStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');
      eq.status = 'in_progress';
      eq.repairStatus = 'in_progress';
      eq.repairAcknowledgedBy = ackBy || 'อาภากร บุญเกตกูล';
      eq.repairAcknowledgedAt = nowStr;

      notifyUpdated();
      return { success: true, equipment: eq };
    },

    resolveDefect: function (deviceId, techName, actionTaken, resolvedDt, testNote) {
      var eq = null;
      for (var i = 0; i < inMemoryData.equipment.length; i++) {
        if (inMemoryData.equipment[i].id === deviceId) {
          eq = inMemoryData.equipment[i];
          break;
        }
      }
      if (!eq) throw new Error('ไม่พบเครื่องมือแพทย์รหัส: ' + deviceId);

      var nowStr = resolvedDt || new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16).replace('T', ' ');
      var defectLog = {
        id: 'FIX-' + Date.now(),
        deviceId: eq.id,
        deviceAsset: eq.assetCode,
        deviceName: eq.name,
        department: eq.currentDept,
        defectReason: eq.abnormalReason || 'ตรวจพบข้อบกพร่อง',
        reportedAt: eq.repairReportedAt || eq.lastEvaluatedAt || '-',
        reportedBy: eq.repairReportedBy || eq.lastEvaluatedBy || '-',
        acknowledgedBy: eq.repairAcknowledgedBy || '-',
        resolvedAt: nowStr,
        resolvedBy: techName || 'อาภากร บุญเกตกูล',
        actionTaken: actionTaken || 'ดำเนินการแก้ไขและทดสอบระบบเรียบร้อย',
        testResultNote: testNote || ''
      };

      eq.status = 'ready';
      eq.repairStatus = 'ready';
      eq.abnormalReason = '';

      inMemoryData.repairs.unshift(defectLog);
      notifyUpdated();
      return { success: true, equipment: eq, repairRecord: defectLog };
    },

    getDefectiveEquipment: function () {
      return (inMemoryData.equipment || []).filter(function (eq) {
        return eq.status === 'abnormal' || eq.status === 'in_progress' || eq.repairStatus === 'reported' || eq.repairStatus === 'in_progress';
      });
    },

    getRepairs: function () {
      return inMemoryData.repairs || [];
    },

    isBatteryMandatoryDate: function (dateObjOrStr) {
      var d = dateObjOrStr ? new Date(dateObjOrStr) : new Date();
      var day = d.getDate();
      return day === 1 || day === 16;
    },

    getBatteryEvaluations: function (cycleFilter) {
      var list = (inMemoryData.evaluations || []).filter(function (ev) {
        return ev.upsBattery && ev.upsBattery.tested;
      });
      if (cycleFilter && cycleFilter !== 'all') {
        list = list.filter(function (ev) {
          return (ev.upsBattery && ev.upsBattery.cycleDate === cycleFilter) || 
                 (ev.evaluatedAt && ev.evaluatedAt.indexOf(cycleFilter) === 0);
        });
      }
      return list;
    }
  };
})(window);
