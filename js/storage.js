/**
 * PPCH Medical Equipment Tracking & Evaluation System
 * State & Storage Manager (LocalStorage + Event Dispatcher)
 */

(function (window) {
  var STORAGE_KEY = window.PPCH_CONFIG.storageKey;
  var TODAY = window.PPCH_CONFIG.todayDate || new Date().toISOString().slice(0, 10);

  // Seed battery inspections for recent cycles (1st of Oct, 16th of Sep)
  var INITIAL_BATTERY_SEEDS = [
    {
      id: 'EV-BAT-20261001-01',
      deviceId: 'PPCH-EQ-DEF-001',
      deviceAsset: 'EQ-68-DEF-001',
      deviceName: 'เครื่อง Defibrillator ชนิดสองทิศทาง (Biphasic)',
      formId: 'defibrillator',
      department: 'ER',
      evaluatedBy: 'พว.กมลทิพย์ ก้องเสียง',
      evaluatedAt: '2026-10-01 08:30',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass', '5': 'pass', '6': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '02:45', runtimeHours: 2, runtimeMinutes: 45, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-02',
      deviceId: 'PPCH-EQ-DEF-002',
      deviceAsset: 'EQ-68-DEF-002',
      deviceName: 'เครื่อง Defibrillator พร้อม Pacing',
      formId: 'defibrillator',
      department: 'ICU',
      evaluatedBy: 'พว.สมใจ นวลละออง',
      evaluatedAt: '2026-10-01 08:45',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass', '5': 'pass', '6': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '02:15', runtimeHours: 2, runtimeMinutes: 15, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-03',
      deviceId: 'PPCH-EQ-VENT-001',
      deviceAsset: 'EQ-67-VENT-001',
      deviceName: 'เครื่องช่วยหายใจชนิดควบคุมด้วยปริมาตรและความดัน',
      formId: 'ventilator',
      department: 'ICU',
      evaluatedBy: 'พว.สมใจ นวลละออง',
      evaluatedAt: '2026-10-01 09:10',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass', '5': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '01:30', runtimeHours: 1, runtimeMinutes: 30, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-04',
      deviceId: 'PPCH-EQ-VENT-002',
      deviceAsset: 'EQ-67-VENT-002',
      deviceName: 'เครื่องช่วยหายใจ ICU Ventilator ชนิดเคลื่อนย้าย',
      formId: 'ventilator',
      department: 'CENTRAL',
      evaluatedBy: 'นายช่างประสิทธิ์ บุญมี',
      evaluatedAt: '2026-10-01 09:30',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass', '5': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '01:15', runtimeHours: 1, runtimeMinutes: 15, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-05',
      deviceId: 'PPCH-EQ-HF-001',
      deviceAsset: 'EQ-66-HF-001',
      deviceName: 'เครื่อง High Flow Nasal Cannula (HHHFINC)',
      formId: 'high_flow',
      department: 'ER',
      evaluatedBy: 'พว.กมลทิพย์ ก้องเสียง',
      evaluatedAt: '2026-10-01 10:00',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '01:45', runtimeHours: 1, runtimeMinutes: 45, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-06',
      deviceId: 'PPCH-EQ-INF-001',
      deviceAsset: 'EQ-65-INF-001',
      deviceName: 'เครื่องควบคุมการให้สารน้ำทางหลอดเลือดดำ (Infusion Pump)',
      formId: 'infusion_pump',
      department: 'WARD23',
      evaluatedBy: 'พว.สุดารัตน์ พิมพา',
      evaluatedAt: '2026-10-01 10:15',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '04:20', runtimeHours: 4, runtimeMinutes: 20, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-07',
      deviceId: 'PPCH-EQ-VS-001',
      deviceAsset: 'EQ-66-VS-001',
      deviceName: 'เครื่องตรวจติดตามสัญญาณชีพข้างเตียง (Vital Signs Monitor)',
      formId: 'vital_signs',
      department: 'OPD',
      evaluatedBy: 'พว.อนงค์ ศรีสวัสดิ์',
      evaluatedAt: '2026-10-01 10:40',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '03:10', runtimeHours: 3, runtimeMinutes: 10, cycleDate: '2026-10-01', status: 'normal' }
    },
    {
      id: 'EV-BAT-20261001-08',
      deviceId: 'PPCH-EQ-ANES-001',
      deviceAsset: 'EQ-65-ANES-001',
      deviceName: 'เครื่องดมยาสลบพร้อมระบบช่วยหายใจ (Anesthesia Machine)',
      formId: 'anesthesia',
      department: 'OR',
      evaluatedBy: 'พว.วราภรณ์ มั่นคง',
      evaluatedAt: '2026-10-01 11:00',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '01:40', runtimeHours: 1, runtimeMinutes: 40, cycleDate: '2026-10-01', status: 'normal' }
    },
    // Previous cycle: 2026-09-16
    {
      id: 'EV-BAT-20260916-01',
      deviceId: 'PPCH-EQ-DEF-001',
      deviceAsset: 'EQ-68-DEF-001',
      deviceName: 'เครื่อง Defibrillator ชนิดสองทิศทาง (Biphasic)',
      formId: 'defibrillator',
      department: 'ER',
      evaluatedBy: 'พว.กมลทิพย์ ก้องเสียง',
      evaluatedAt: '2026-09-16 08:35',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass', '5': 'pass', '6': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '02:50', runtimeHours: 2, runtimeMinutes: 50, cycleDate: '2026-09-16', status: 'normal' }
    },
    {
      id: 'EV-BAT-20260916-02',
      deviceId: 'PPCH-EQ-VENT-001',
      deviceAsset: 'EQ-67-VENT-001',
      deviceName: 'เครื่องช่วยหายใจชนิดควบคุมด้วยปริมาตรและความดัน',
      formId: 'ventilator',
      department: 'ICU',
      evaluatedBy: 'พว.สมใจ นวลละออง',
      evaluatedAt: '2026-09-16 09:20',
      result: 'normal',
      abnormalNote: '',
      checklist: { '0': 'pass', '1': 'pass', '2': 'pass', '3': 'pass', '4': 'pass' },
      upsBattery: { tested: true, runtimeFormatted: '01:35', runtimeHours: 1, runtimeMinutes: 35, cycleDate: '2026-09-16', status: 'normal' }
    }
  ];

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
            // Ensure battery cycle seeds exist if not present
            var hasBatteryRecords = parsed.evaluations.some(function (ev) { return ev.upsBattery && ev.upsBattery.tested; });
            if (!hasBatteryRecords) {
              parsed.evaluations = INITIAL_BATTERY_SEEDS.concat(parsed.evaluations);
              saveData(parsed);
            }
          } else {
            parsed.evaluations = INITIAL_BATTERY_SEEDS.slice();
            saveData(parsed);
          }
          if (Array.isArray(parsed.transfers)) {
            parsed.transfers = parsed.transfers.filter(function (tr) {
              return tr.id && tr.id.indexOf('TR-20260929') === -1;
            });
          }

          // Ensure any new equipment from PPCH_CONFIG.initialEquipment is merged
          var existingEqMap = {};
          parsed.equipment.forEach(function (eq) { existingEqMap[eq.id] = true; });
          var hasNewEq = false;
          (window.PPCH_CONFIG.initialEquipment || []).forEach(function (eq) {
            if (!existingEqMap[eq.id]) {
              parsed.equipment.push(eq);
              hasNewEq = true;
            }
          });
          if (hasNewEq) {
            saveData(parsed);
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read error, using fallback seed:', e);
    }

    // Default Seed (With Battery Cycle Seeds)
    var initial = {
      equipment: window.PPCH_CONFIG.initialEquipment,
      evaluations: INITIAL_BATTERY_SEEDS.slice(),
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

      // Track latest UPS Battery status if evaluated
      if (evalPayload.upsBattery && evalPayload.upsBattery.tested) {
        eq.lastBatteryTestedAt = nowStr;
        eq.lastBatteryRuntime = evalPayload.upsBattery.runtimeFormatted;
        eq.lastBatteryStatus = evalPayload.upsBattery.status || 'normal';
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
        checklist: evalPayload.checklist || {},
        upsBattery: evalPayload.upsBattery || null
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

    // Check if a given date is mandatory battery inspection date (1st or 16th)
    isBatteryMandatoryDate: function (dateObjOrStr) {
      var d = dateObjOrStr ? new Date(dateObjOrStr) : new Date();
      var day = d.getDate();
      return day === 1 || day === 16;
    },

    // Get all evaluations with UPS battery inspection records
    getBatteryEvaluations: function (cycleFilter) {
      var data = loadData();
      var list = (data.evaluations || []).filter(function (ev) {
        return ev.upsBattery && ev.upsBattery.tested;
      });
      if (cycleFilter && cycleFilter !== 'all') {
        list = list.filter(function (ev) {
          if (cycleFilter === 'latest') {
            // Find most recent cycle
            return true;
          }
          return (ev.upsBattery && ev.upsBattery.cycleDate === cycleFilter) || 
                 (ev.evaluatedAt && ev.evaluatedAt.indexOf(cycleFilter) === 0);
        });
      }
      return list;
    },

    // Reset seed data
    resetSeed: function () {
      localStorage.removeItem(STORAGE_KEY);
      return loadData();
    }
  };
})(window);
