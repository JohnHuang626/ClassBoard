import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove, push, update } from 'firebase/database';
import { 
  Calendar as CalendarIcon, Clock, Users, UserCheck, CheckCircle, 
  XCircle, LogOut, Lock, FileText, ChevronRight, AlertCircle, 
  RefreshCw, BookOpen, Send, Plus, Trash2, Key, ArrowLeft, Upload 
} from 'lucide-react';

// ==================== FIREBASE 初始化設定 ====================
const firebaseConfig = {
  apiKey: "AIzaSyDyqxSFKnQIbgL-PCl6BTi_IvJyDgjIRB8",
  authDomain: "chia-hsin-db.firebaseapp.com",
  projectId: "chia-hsin-db",
  storageBucket: "chia-hsin-db.firebasestorage.app",
  messagingSenderId: "744043549182",
  appId: "1:744043549182:web:e729de500f3426f05870af"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==================== 預設初始資料 ====================
const INITIAL_CLASSES = ["701", "702", "703", "704", "801", "802", "803", "804", "901", "902", "903", "904", "905"];

const INITIAL_TEACHERS = [
  { id: "t1", name: "溫盛傑", subject: "數學", pass: "1234" },
  { id: "t2", name: "林秀錦", subject: "國文", pass: "1234" },
  { id: "t3", name: "陳建銘", subject: "英文", pass: "1234" },
  { id: "t4", name: "黃美惠", subject: "理化", pass: "1234" }
];

const INITIAL_SCHEDULES = {
  "701": {
    1: { 1: { teacher: "溫盛傑", subject: "數學" }, 2: { teacher: "林秀錦", subject: "國文" }, 3: { teacher: "陳建銘", subject: "英文" }, 4: { teacher: "黃美惠", subject: "理化" }, 5: { teacher: "溫盛傑", subject: "數學" }, 6: { teacher: "林秀錦", subject: "國文" }, 7: { teacher: "陳建銘", subject: "英文" } },
    2: { 1: { teacher: "林秀錦", subject: "國文" }, 2: { teacher: "溫盛傑", subject: "數學" }, 3: { teacher: "黃美惠", subject: "理化" }, 4: { teacher: "陳建銘", subject: "英文" }, 5: { teacher: "林秀錦", subject: "國文" }, 6: { teacher: "溫盛傑", subject: "數學" }, 7: { teacher: "黃美惠", subject: "理化" } },
    3: { 1: { teacher: "陳建銘", subject: "英文" }, 2: { teacher: "黃美惠", subject: "理化" }, 3: { teacher: "溫盛傑", subject: "數學" }, 4: { teacher: "林秀錦", subject: "國文" }, 5: { teacher: "陳建銘", subject: "英文" }, 6: { teacher: "黃美惠", subject: "理化" }, 7: { teacher: "溫盛傑", subject: "數學" } },
    4: { 1: { teacher: "黃美惠", subject: "理化" }, 2: { teacher: "陳建銘", subject: "英文" }, 3: { teacher: "林秀錦", subject: "國文" }, 4: { teacher: "溫盛傑", subject: "數學" }, 5: { teacher: "黃美惠", subject: "理化" }, 6: { teacher: "陳建銘", subject: "英文" }, 7: { teacher: "林秀錦", subject: "國文" } },
    5: { 1: { teacher: "溫盛傑", subject: "數學" }, 2: { teacher: "林秀錦", subject: "國文" }, 3: { teacher: "陳建銘", subject: "英文" }, 4: { teacher: "黃美惠", subject: "理化" }, 5: { teacher: "溫盛傑", subject: "數學" }, 6: { teacher: "林秀錦", subject: "國文" }, 7: { teacher: "陳建銘", subject: "英文" } }
  }
};

const TIME_SLOTS = [
  { period: 1, time: "08:15 - 09:00" },
  { period: 2, time: "09:10 - 09:55" },
  { period: 3, time: "10:05 - 10:50" },
  { period: 4, time: "11:00 - 11:45" },
  { period: 5, time: "13:30 - 14:15" },
  { period: 6, time: "14:25 - 15:10" },
  { period: 7, time: "15:20 - 16:05" },
  { period: 8, time: "16:15 - 17:00" }
];

const WEEKDAYS = [
  { id: 1, name: "星期一" },
  { id: 2, name: "星期二" },
  { id: 3, name: "星期三" },
  { id: 4, name: "星期四" },
  { id: 5, name: "星期五" }
];

const LEAVE_REASONS = [
  "事假", "病假", "公假", "差假", "休假", 
  "身心調適假", "喪假", "產假", "公傷假", "其他"
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [requests, setRequests] = useState({});
  const [passwords, setPasswords] = useState({});

  const [activeTab, setActiveTab] = useState('schedule');
  const [userRole, setUserRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [viewMode, setViewMode] = useState('class'); 
  const [selectedClass, setSelectedClass] = useState('701');
  const [selectedTeacher, setSelectedTeacher] = useState('溫盛傑');

  const [actionModal, setActionModal] = useState(null); 
  const [actionType, setActionType] = useState('substitute'); 
  const [leaveReason, setLeaveReason] = useState('事假');
  const [targetTeacher, setTargetTeacher] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [swapPeriod, setSwapPeriod] = useState(1);
  const [swapDate, setSwapDate] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // 讀取 Firebase 資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbRef = ref(db);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val.classes) setClasses(val.classes);
          if (val.teachers) setTeachers(val.teachers);
          if (val.schedules) setSchedules(val.schedules);
          if (val.requests) setRequests(val.requests);
          if (val.passwords) setPasswords(val.passwords);
        }
      } catch (err) {
        console.error("Firebase 讀取失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveDataToFirebase = async (path, data) => {
    try {
      await set(ref(db, path), data);
    } catch (err) {
      console.error("Firebase 寫入失敗:", err);
    }
  };

  const handleInitializeDB = async () => {
    if (window.confirm("確定要將預設的班級、老師與課表上傳到雲端嗎？")) {
      await saveDataToFirebase('classes', INITIAL_CLASSES);
      await saveDataToFirebase('teachers', INITIAL_TEACHERS);
      await saveDataToFirebase('schedules', INITIAL_SCHEDULES);
      await saveDataToFirebase('requests', {});
      await saveDataToFirebase('passwords', {});
      setClasses(INITIAL_CLASSES);
      setTeachers(INITIAL_TEACHERS);
      setSchedules(INITIAL_SCHEDULES);
      setRequests({});
      setPasswords({});
      alert("雲端資料初始化成功！");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginId === 'admin888') {
      if (loginPass === 'admin888') {
        setUserRole('admin');
        setCurrentUser('管理員');
        setShowLoginModal(false);
        setLoginPass('');
        return;
      } else {
        setLoginError('管理者密碼錯誤 (預設 admin888)');
        return;
      }
    }

    const foundTeacher = teachers.find(t => t.name === loginId);
    if (foundTeacher) {
      const customPass = passwords[foundTeacher.name] || foundTeacher.pass || '1234';
      if (loginPass === customPass) {
        setUserRole('teacher');
        setCurrentUser(foundTeacher.name);
        setSelectedTeacher(foundTeacher.name);
        setShowLoginModal(false);
        setLoginPass('');
        return;
      } else {
        setLoginError('教師密碼錯誤 (預設 1234)');
        return;
      }
    }

    setLoginError('找不到此帳號');
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser('');
    setActiveTab('schedule');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPassMsg('');
    const currentCustomPass = passwords[currentUser] || teachers.find(t => t.name === currentUser)?.pass || '1234';
    if (oldPass !== currentCustomPass) {
      setPassMsg('舊密碼輸入錯誤');
      return;
    }
    const newPassMap = { ...passwords, [currentUser]: newPass };
    setPasswords(newPassMap);
    saveDataToFirebase('passwords', newPassMap);
    setPassMsg('密碼修改成功！');
    setOldPass('');
    setNewPass('');
    setTimeout(() => {
      setShowPasswordModal(false);
      setPassMsg('');
    }, 1500);
  };

  const handleCellClick = (className, dayId, period, cellData) => {
    if (!userRole) {
      alert("請先點擊右上角進行「教師登入」才能申請代調課！");
      setShowLoginModal(true);
      return;
    }
    if (userRole === 'admin') return; 
    if (!cellData || cellData.teacher !== currentUser) {
      alert("您只能針對「自己有上課」的時段發起代調課申請！");
      return;
    }

    const defaultTarget = teachers.find(t => t.name !== currentUser)?.name || '';
    setTargetTeacher(defaultTarget);
    setActionModal({ className, dayId, period, cellData });
    setActionType('substitute');
    setLeaveReason('事假');
    setTargetDate('');
    setSwapPeriod(1);
    setSwapDate('');
    setActionSuccess('');
  };

  const submitActionRequest = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    const newReqId = 'req_' + Date.now();
    const newReqData = {
      id: newReqId,
      applicant: currentUser,
      className: actionModal.className,
      dayId: actionModal.dayId,
      period: actionModal.period,
      subject: actionModal.cellData.subject,
      type: actionType, 
      leaveReason: actionType === 'substitute' ? leaveReason : '',
      targetTeacher: targetTeacher,
      targetDate: actionType === 'substitute' ? targetDate : '',
      swapPeriod: actionType === 'swap' ? Number(swapPeriod) : null,
      swapDate: actionType === 'swap' ? swapDate : '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedRequests = { ...requests, [newReqId]: newReqData };
    setRequests(updatedRequests);
    await saveDataToFirebase('requests', updatedRequests);
    setActionSuccess('申請已成功送出，等待教務處審核！');
    setTimeout(() => {
      setActionModal(null);
      setActionSuccess('');
    }, 1500);
  };

  const handleApproveRequest = async (reqId) => {
    const req = requests[reqId];
    if (!req) return;
    const updatedRequests = {
      ...requests,
      [reqId]: { ...req, status: 'approved' }
    };
    setRequests(updatedRequests);
    await saveDataToFirebase('requests', updatedRequests);
  };

  const handleBatchApprove = async (teacherName) => {
    const updatedRequests = { ...requests };
    let hasPending = false;
    Object.keys(updatedRequests).forEach(id => {
      const r = updatedRequests[id];
      if (r.applicant === teacherName && r.status === 'pending') {
        updatedRequests[id] = { ...r, status: 'approved' };
        hasPending = true;
      }
    });
    if (!hasPending) {
      alert(`${teacherName} 老師目前沒有待審核的申請！`);
      return;
    }
    setRequests(updatedRequests);
    await saveDataToFirebase('requests', updatedRequests);
    alert(`已成功批次核准 ${teacherName} 老師的所有待審核申請！`);
  };

  const handleRejectRequest = async (reqId) => {
    const req = requests[reqId];
    if (!req) return;
    const updatedRequests = {
      ...requests,
      [reqId]: { ...req, status: 'rejected' }
    };
    setRequests(updatedRequests);
    await saveDataToFirebase('requests', updatedRequests);
  };

  const handleDeleteRequest = async (reqId) => {
    if (window.confirm("確定要刪除這筆紀錄嗎？")) {
      const updatedRequests = { ...requests };
      delete updatedRequests[reqId];
      setRequests(updatedRequests);
      await saveDataToFirebase('requests', updatedRequests);
    }
  };

  const handleSendEmail = (req) => {
    const subject = encodeURIComponent(`【嘉新國中】調代課通知 - ${req.applicant}老師`);
    let body = `各位老師好：\n\n`;
    body += `老師 ${req.applicant} 提出了調代課申請，內容如下：\n`;
    body += `- 假別/類型：${req.type === 'substitute' ? `請假 (${req.leaveReason})` : '調課'}\n`;
    body += `- 原授課班級：${req.className} 班\n`;
    body += `- 原上課時間：星期${req.dayId} 第 ${req.period} 節 (${req.subject})\n`;
    if (req.type === 'substitute') {
      body += `- 代課老師：${req.targetTeacher}\n`;
      body += `- 代課日期：${req.targetDate || '未指定'}\n`;
    } else {
      body += `- 調換對象：${req.targetTeacher}\n`;
      body += `- 對方上課日期：${req.swapDate || '未指定'} 第 ${req.swapPeriod} 節\n`;
    }
    body += `\n教務處已完成審核。特此通知相關人員。\n\n嘉新國中教務處 敬上`;
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  const handleSendBatchEmail = (teacherName, teacherReqs) => {
    const subject = encodeURIComponent(`【嘉新國中】調代課總表通知 - ${teacherName}老師`);
    let body = `敬愛的老師們 您好：\n\n`;
    body += `以下為 ${teacherName} 老師近期已核准之調代課申請總表：\n\n`;
    teacherReqs.forEach((r, idx) => {
      body += `【申請 ${idx + 1}】\n`;
      body += `- 類型：${r.type === 'substitute' ? `請假 (${r.leaveReason})` : '調課'}\n`;
      body += `- 班級/節次：${r.className} 班 星期${r.dayId} 第 ${r.period} 節 (${r.subject})\n`;
      if (r.type === 'substitute') {
        body += `- 代課老師：${r.targetTeacher} (日期: ${r.targetDate || '未指定'})\n`;
      } else {
        body += `- 調換對象：${r.targetTeacher} (換課日期: ${r.swapDate || '未指定'} 第 ${r.swapPeriod} 節)\n`;
      }
      body += `---------------------------\n`;
    });
    body += `\n特此通知相關授課與代課老師，感謝配合！\n\n嘉新國中教務處 敬上`;
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  // 新增班級
  const [newClassName, setNewClassName] = useState('');
  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    if (classes.includes(newClassName.trim())) {
      alert("此班級已存在！");
      return;
    }
    const updated = [...classes, newClassName.trim()];
    setClasses(updated);
    await saveDataToFirebase('classes', updated);
    setNewClassName('');
  };

  const handleDeleteClass = async (cls) => {
    if (window.confirm(`確定要刪除班級 ${cls} 及其所有課表嗎？`)) {
      const updatedClasses = classes.filter(c => c !== cls);
      const updatedSchedules = { ...schedules };
      delete updatedSchedules[cls];
      setClasses(updatedClasses);
      setSchedules(updatedSchedules);
      await saveDataToFirebase('classes', updatedClasses);
      await saveDataToFirebase('schedules', updatedSchedules);
      if (selectedClass === cls && updatedClasses.length > 0) {
        setSelectedClass(updatedClasses[0]);
      }
    }
  };

  // 新增老師
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubj, setNewTeacherSubj] = useState('');
  const handleAddTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherSubj.trim()) {
      alert("請輸入老師姓名與任教科目！");
      return;
    }
    if (teachers.some(t => t.name === newTeacherName.trim())) {
      alert("此老師姓名已存在！");
      return;
    }
    const newT = { id: 't_' + Date.now(), name: newTeacherName.trim(), subject: newTeacherSubj.trim(), pass: "1234" };
    const updated = [...teachers, newT];
    setTeachers(updated);
    await saveDataToFirebase('teachers', updated);
    setNewTeacherName('');
    setNewTeacherSubj('');
  };

  const handleDeleteTeacher = async (tName) => {
    if (window.confirm(`確定要刪除老師 ${tName} 嗎？系統將同步清除其相關排課紀錄。`)) {
      const updatedTeachers = teachers.filter(t => t.name !== tName);
      setTeachers(updatedTeachers);
      await saveDataToFirebase('teachers', updatedTeachers);

      const updatedSchedules = JSON.parse(JSON.stringify(schedules));
      Object.keys(updatedSchedules).forEach(cls => {
        Object.keys(updatedSchedules[cls]).forEach(day => {
          Object.keys(updatedSchedules[cls][day]).forEach(period => {
            if (updatedSchedules[cls][day][period]?.teacher === tName) {
              delete updatedSchedules[cls][day][period];
            }
          });
        });
      });
      setSchedules(updatedSchedules);
      await saveDataToFirebase('schedules', updatedSchedules);

      if (selectedTeacher === tName && updatedTeachers.length > 0) {
        setSelectedTeacher(updatedTeachers[0].name);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-medium">正在連線至嘉新國中雲端資料庫...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* 頂部導覽列 */}
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-200" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">嘉義縣立嘉新國民中學</h1>
              <p className="text-xs text-blue-200">智慧課表與代調課系統</p>
            </div>
          </div>

          <nav className="flex items-center space-x-2 my-2 sm:my-0">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'schedule' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              📅 教師課表
            </button>
            <button 
              onClick={() => setActiveTab('classSchedule')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'classSchedule' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              🏫 班級課表
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium relative transition ${activeTab === 'requests' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              📋 審核與紀錄
              {Object.values(requests).filter(r => r.status === 'pending').length > 0 && userRole === 'admin' && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                  {Object.values(requests).filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            {userRole ? (
              <div className="flex items-center space-x-2 bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-600">
                <span className="text-xs bg-blue-900 px-2 py-0.5 rounded text-blue-200 font-semibold">
                  {userRole === 'admin' ? '管理者' : '教師'}
                </span>
                <span className="text-sm font-medium">{currentUser}</span>
                {userRole === 'teacher' && (
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="p-1 text-amber-300 hover:text-white transition"
                    title="修改密碼"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-1 text-red-200 hover:text-white transition"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setLoginId(''); setLoginPass(''); setLoginError(''); setShowLoginModal(true); }}
                className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
              >
                <Lock className="w-4 h-4" />
                <span>教師登入</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {userRole === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <div>
                <h4 className="font-bold text-amber-800">系統管理員專區</h4>
                <p className="text-sm text-amber-700">您可以隨時重置雲端資料庫以恢復預設測試排課與名單。</p>
              </div>
            </div>
            <button 
              onClick={handleInitializeDB}
              className="mt-2 sm:mt-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
            >
              🔄 載入初始預設資料
            </button>
          </div>
        )}

        {/* 1. 教師課表模式 */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-700">選擇檢視教師：</span>
                <select 
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} 老師 ({t.subject})</option>
                  ))}
                </select>

                {userRole === 'teacher' && selectedTeacher !== currentUser && (
                  <button
                    onClick={() => setSelectedTeacher(currentUser)}
                    className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>返回我的課表</span>
                  </button>
                )}
              </div>

              {userRole === 'admin' && (
                <div className="flex flex-wrap items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
                  <input 
                    type="text" 
                    placeholder="新老師姓名" 
                    value={newTeacherName} 
                    onChange={e => setNewTeacherName(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-28 outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="科目" 
                    value={newTeacherSubj} 
                    onChange={e => setNewTeacherSubj(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-20 outline-none"
                  />
                  <button 
                    onClick={handleAddTeacher}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" /><span>新增老師</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteTeacher(selectedTeacher)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" /><span>刪除此老師</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center space-x-2">
                  <span>👨‍🏫 {selectedTeacher} 老師的個人課表</span>
                </h3>
                <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1 rounded-full font-medium">
                  {userRole === 'teacher' && selectedTeacher === currentUser ? '點擊有授課的格子可直接發起調代課' : '檢視模式'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm font-semibold border-b border-slate-200">
                      <th className="py-3 px-4 w-28 border-r border-slate-200">節次 / 時間</th>
                      {WEEKDAYS.map(day => (
                        <th key={day.id} className="py-3 px-4 border-r border-slate-200 last:border-r-0">{day.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(slot => (
                      <tr key={slot.period} className="border-b border-slate-200 hover:bg-slate-50/50 transition">
                        <td className="bg-slate-50/80 py-3 px-3 border-r border-slate-200 text-xs font-medium text-slate-600">
                          <div>第 {slot.period} 節</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{slot.time}</div>
                        </td>
                        {WEEKDAYS.map(day => {
                          let teachingClass = null;
                          let subjectName = '';
                          Object.keys(schedules).forEach(cls => {
                            const pData = schedules[cls]?.[day.id]?.[slot.period];
                            if (pData && pData.teacher === selectedTeacher) {
                              teachingClass = cls;
                              subjectName = pData.subject;
                            }
                          });

                          const isMyClass = userRole === 'teacher' && selectedTeacher === currentUser && teachingClass;

                          return (
                            <td 
                              key={day.id} 
                              onClick={() => isMyClass && handleCellClick(teachingClass, day.id, slot.period, { teacher: selectedTeacher, subject: subjectName })}
                              className={`p-3 border-r border-slate-200 last:border-r-0 transition relative ${
                                isMyClass ? 'cursor-pointer hover:bg-blue-50 group' : ''
                              }`}
                            >
                              {teachingClass ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 shadow-xs group-hover:border-blue-400">
                                  <div className="font-bold text-blue-900 text-sm">{teachingClass} 班</div>
                                  <div className="text-xs text-blue-700 mt-0.5">{subjectName}</div>
                                  {isMyClass && (
                                    <div className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 mt-1 font-semibold transition">
                                      ✨ 點擊申請調代
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. 班級課表模式 */}
        {activeTab === 'classSchedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="font-bold text-slate-700">選擇檢視班級：</span>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls} 班</option>
                  ))}
                </select>
              </div>

              {userRole === 'admin' && (
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    placeholder="新班級名稱(例: 706)" 
                    value={newClassName} 
                    onChange={e => setNewClassName(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-36 outline-none"
                  />
                  <button 
                    onClick={handleAddClass}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" /><span>新增班級</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteClass(selectedClass)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" /><span>刪除此班級</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">🏫 {selectedClass} 班級課表</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm font-semibold border-b border-slate-200">
                      <th className="py-3 px-4 w-28 border-r border-slate-200">節次 / 時間</th>
                      {WEEKDAYS.map(day => (
                        <th key={day.id} className="py-3 px-4 border-r border-slate-200 last:border-r-0">{day.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(slot => (
                      <tr key={slot.period} className="border-b border-slate-200 hover:bg-slate-50/50 transition">
                        <td className="bg-slate-50/80 py-3 px-3 border-r border-slate-200 text-xs font-medium text-slate-600">
                          <div>第 {slot.period} 節</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{slot.time}</div>
                        </td>
                        {WEEKDAYS.map(day => {
                          const cellData = schedules[selectedClass]?.[day.id]?.[slot.period];
                          return (
                            <td key={day.id} className="p-3 border-r border-slate-200 last:border-r-0">
                              {cellData ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 shadow-xs">
                                  <div className="font-bold text-emerald-900 text-sm">{cellData.subject}</div>
                                  <div className="text-xs text-emerald-700 mt-0.5">{cellData.teacher} 老師</div>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. 審核與紀錄中心 (含批次核准與總表寄送) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">📋 調代課申請審核與紀錄中心</h3>
                  <p className="text-sm text-slate-500">檢視所有老師提交的請假代課與跨週調課申請</p>
                </div>
              </div>

              {/* 管理員專屬批次核准與總表寄送區 */}
              {userRole === 'admin' && teachers.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-slate-700">快速批次管理：</span>
                    <select 
                      id="batchTeacherSelect"
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white font-medium"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name} 老師</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const selTeacher = document.getElementById('batchTeacherSelect').value;
                        handleBatchApprove(selTeacher);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>✅ 批次核准該師所有申請</span>
                    </button>
                    <button
                      onClick={() => {
                        const selTeacher = document.getElementById('batchTeacherSelect').value;
                        const teacherReqs = Object.values(requests).filter(r => r.applicant === selTeacher && r.status === 'approved');
                        if (teacherReqs.length === 0) {
                          alert(`該老師目前沒有「已核准」的申請可寄送總表！`);
                          return;
                        }
                        handleSendBatchEmail(selTeacher, teacherReqs);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition flex items-center space-x-1"
                    >
                      <Send className="w-4 h-4" />
                      <span>✉️ 發送合併總表信件</span>
                    </button>
                  </div>
                </div>
              )}

              {Object.keys(requests).length === 0 ? (
                <div className="text-center py-12 text-slate-400">目前沒有任何調代課申請紀錄</div>
              ) : (
                <div className="space-y-4">
                  {Object.values(requests).reverse().map(req => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    const isRejected = req.status === 'rejected';

                    return (
                      <div key={req.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-base">{req.applicant} 老師</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              req.type === 'substitute' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {req.type === 'substitute' ? `請假 (${req.leaveReason || '事假'})` : '調課'}
                            </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              isPending ? 'bg-yellow-100 text-yellow-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isPending ? '⏳ 待審核' : isApproved ? '✅ 已核准' : '❌ 已駁回'}
                            </span>
                          </div>

                          <p className="text-sm text-slate-600">
                            原授課：<strong className="text-slate-800">{req.className} 班</strong> 
                            （星期{req.dayId} 第 {req.period} 節 - {req.subject}）
                          </p>

                          {req.type === 'substitute' ? (
                            <p className="text-sm text-slate-600">
                              代課人選：<strong className="text-blue-600">{req.targetTeacher} 老師</strong> 
                              {req.targetDate && <span className="text-xs text-slate-500 ml-2">(代課日期: {req.targetDate})</span>}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-600">
                              跨週調課對象：<strong className="text-blue-600">{req.targetTeacher} 老師</strong>
                              <span className="text-xs text-slate-500 ml-2">(對方授課日期: {req.swapDate || '未指定'} 第 {req.swapPeriod} 節)</span>
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">申請時間：{new Date(req.createdAt).toLocaleString()}</p>
                        </div>

                        {/* 動作按鈕區 */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                          {userRole === 'admin' && isPending && (
                            <>
                              <button 
                                onClick={() => handleApproveRequest(req.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                              >
                                <CheckCircle className="w-4 h-4" /><span>核准</span>
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(req.id)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1"
                              >
                                <XCircle className="w-4 h-4" /><span>駁回</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button 
                              onClick={() => handleSendEmail(req)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 shadow-xs"
                            >
                              <Send className="w-4 h-4" /><span>寄送 Gmail 通知</span>
                            </button>
                          )}

                          {(userRole === 'admin' || currentUser === req.applicant) && (
                            <button 
                              onClick={() => handleDeleteRequest(req.id)}
                              className="bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 p-2 rounded-lg transition"
                              title="刪除紀錄"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 登入彈跳視窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>教師登入</span>
              </h3>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">選擇您的身分 / 帳號</label>
                <select 
                  value={loginId} 
                  onChange={e => setLoginId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  <option value="">-- 請選擇教師或管理者 --</option>
                  <option value="admin888">👑 系統管理者 (admin888)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>教師：{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">登入密碼</label>
                <input 
                  type="password" 
                  value={loginPass} 
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="請輸入密碼 (預設教師1234 / 管理者admin888)"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  確認登入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 申請代調課互動彈跳視窗 */}
      {actionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-800">
                ✨ 發起調代課申請
              </h3>
              <button 
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-900 space-y-1">
              <p><strong>授課班級：</strong>{actionModal.className} 班</p>
              <p><strong>原上課時段：</strong>星期{actionModal.dayId} 第 {actionModal.period} 節 ({actionModal.cellData.subject})</p>
            </div>

            <form onSubmit={submitActionRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">申請類型</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="actionType" 
                      value="substitute" 
                      checked={actionType === 'substitute'}
                      onChange={() => setActionType('substitute')}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">請假找人代課</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="actionType" 
                      value="swap" 
                      checked={actionType === 'swap'}
                      onChange={() => setActionType('swap')}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">與人調課 (跨週)</span>
                  </label>
                </div>
              </div>

              {actionType === 'substitute' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">請假事由 (下拉選單)</label>
                    <select 
                      value={leaveReason} 
                      onChange={e => setLeaveReason(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      {LEAVE_REASONS.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">選擇代課老師</label>
                    <select 
                      value={targetTeacher} 
                      onChange={e => setTargetTeacher(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      <option value="">-- 請選擇代課老師 --</option>
                      {teachers.filter(t => t.name !== currentUser).map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">代課確切日期</label>
                    <input 
                      type="date" 
                      value={targetDate} 
                      onChange={e => setTargetDate(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              {actionType === 'swap' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">選擇調課對象</label>
                    <select 
                      value={targetTeacher} 
                      onChange={e => setTargetTeacher(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      <option value="">-- 請選擇調課老師 --</option>
                      {teachers.filter(t => t.name !== currentUser).map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">對方換課日期</label>
                      <input 
                        type="date" 
                        value={swapDate} 
                        onChange={e => setSwapDate(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">對方這堂課第幾節</label>
                      <select 
                        value={swapPeriod} 
                        onChange={e => setSwapPeriod(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                      >
                        {TIME_SLOTS.map(s => (
                          <option key={s.period} value={s.period}>第 {s.period} 節</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {actionSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium text-center">
                  {actionSuccess}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  送出申請
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 修改密碼彈跳視窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-600" />
                <span>修改個人密碼</span>
              </h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">請輸入舊密碼</label>
                <input 
                  type="password" 
                  value={oldPass} 
                  onChange={e => setOldPass(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">請輸入新密碼</label>
                <input 
                  type="password" 
                  value={newPass} 
                  onChange={e => setNewPass(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {passMsg && (
                <div className={`px-3 py-2 rounded-lg text-xs font-medium text-center ${
                  passMsg.includes('成功') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                  {passMsg}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow transition"
                >
                  確認修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 頁尾 */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        嘉義縣立嘉新國民中學 • 智慧課表與代調課管理系統 (Firebase 雲端同步版)
      </footer>
    </div>
  );
}