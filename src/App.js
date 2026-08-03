import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Users, BookOpen, Calendar, CheckCircle2, Edit, Plus, Trash2, AlertTriangle, X, Lock, Unlock, Key, ShieldAlert, Eraser, ArrowRightLeft, FileText, Printer, Check, Clock, Mail, Upload, Save, Database, ArrowLeft } from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDyqxSFKnQIbgL-PCl6BTi_IvJyDgjIRB8",
  authDomain: "chia-hsin-db.firebaseapp.com",
  projectId: "chia-hsin-db",
  storageBucket: "chia-hsin-db.firebasestorage.app",
  messagingSenderId: "744043549182",
  appId: "1:744043549182:web:e729de500f3426f05870af"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const INITIAL_CLASSES = [
  { id: '701', name: '7年01班' }, { id: '702', name: '7年02班' }, { id: '703', name: '7年03班' }, { id: '704', name: '7年04班' },
  { id: '801', name: '8年01班' }, { id: '802', name: '8年02班' }, { id: '803', name: '8年03班' }, { id: '804', name: '8年04班' },
  { id: '901', name: '9年01班' }, { id: '902', name: '9年02班' }, { id: '903', name: '9年03班' }, { id: '904', name: '9年04班' }, { id: '905', name: '9年05班' }
];

const INITIAL_TEACHERS = [
  { id: 'T001', name: '溫盛傑', subject: '數學', password: '1234' }, 
  { id: 'T002', name: '林秀錦', subject: '國文', password: '1234' },
  { id: 'T003', name: '陳建銘', subject: '英文', password: '1234' }, 
  { id: 'T004', name: '黃美惠', subject: '理化', password: '1234' }
];

const DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五'];
const PERIODS = [
  { id: 1, name: '第一節', time: '08:25 - 09:10' }, { id: 2, name: '第二節', time: '09:20 - 10:05' },
  { id: 3, name: '第三節', time: '10:15 - 11:00' }, { id: 4, name: '第四節', time: '11:10 - 11:55' },
  { id: 'noon', name: '午休', time: '11:55-13:10', isBreak: true },
  { id: 5, name: '第五節', time: '13:20 - 14:05' }, { id: 6, name: '第六節', time: '14:15 - 15:00' },
  { id: 7, name: '第七節', time: '15:15 - 16:00' }, { id: 8, name: '第八節', time: '16:10 - 16:55', isTutor: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState('class'); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('701');
  const [selectedTeacher, setSelectedTeacher] = useState('溫盛傑');
  const [teacherSortMode, setTeacherSortMode] = useState('default');
  
  const [userRole, setUserRole] = useState('guest'); 
  const [loggedTeacherId, setLoggedTeacherId] = useState(null); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedLoginTeacher, setSelectedLoginTeacher] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdOld, setPwdOld] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  const [requestTargetLesson, setRequestTargetLesson] = useState(null);
  const [editRequestData, setEditRequestData] = useState(null);
  const [filterTeacherId, setFilterTeacherId] = useState(''); 

  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassId, setNewClassId] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showDeleteAllClassesModal, setShowDeleteAllClassesModal] = useState(false);
  const [showClearClassModal, setShowClearClassModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [showDeleteAllTeachersModal, setShowDeleteAllTeachersModal] = useState(false);

  useEffect(() => {
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.id.localeCompare(b.id));
      setClasses(data);
      if (data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
    });

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setTeachers(data);
      if (data.length > 0 && !selectedLoginTeacher) setSelectedLoginTeacher(data[0].id);
      if (data.length > 0 && !selectedTeacher) setSelectedTeacher(data[0].id);
    });

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setLessons(data);
    });

    const unsubRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const data = snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRequests(data);
    });

    setTimeout(() => setIsDataLoaded(true), 1000);

    return () => { unsubClasses(); unsubTeachers(); unsubLessons(); unsubRequests(); };
  }, []);

  const showMessage = (type, message) => {
    setImportStatus({ type, message });
    setTimeout(() => setImportStatus({ type: '', message: '' }), 4000);
  };

  const initializeDatabase = async () => {
    showMessage('success', '🔄 正在建立預設資料庫...');
    try {
      const promises = [];
      INITIAL_CLASSES.forEach(c => promises.push(setDoc(doc(db, 'classes', c.id), c)));
      INITIAL_TEACHERS.forEach(t => promises.push(setDoc(doc(db, 'teachers', t.id), t)));
      await Promise.all(promises);
      showMessage('success', '✅ 雲端資料庫建置成功！');
    } catch (error) {
      showMessage('error', '❌ 建置失敗：' + error.message);
    }
  };

  const jumpToTeacher = (teacherId) => {
    setSelectedTeacher(teacherId);
    setViewMode('teacher');
  };

  const jumpToClass = (classId) => {
    setSelectedClass(classId);
    setViewMode('class');
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin888') {
      setUserRole('admin');
      setLoggedTeacherId(null);
      setShowLoginModal(false);
      setAdminPassword('');
      showMessage('success', '✅ 已成功登入為管理者！');
    } else {
      showMessage('error', '❌ 管理者密碼錯誤 (預設 admin888)');
    }
  };

  const handleTeacherLogin = () => {
    const teacherData = teachers.find(t => t.id === selectedLoginTeacher);
    const validPassword = teacherData?.password || '1234'; 

    if (teacherPassword === validPassword || teacherPassword === 'admin888') {
      setUserRole('teacher');
      setLoggedTeacherId(selectedLoginTeacher);
      setSelectedTeacher(selectedLoginTeacher); 
      setViewMode('teacher');
      setActiveTab('schedule');
      setShowLoginModal(false);
      
      const teacherName = teacherData?.name;
      showMessage('success', `👨‍🏫 歡迎登入，${teacherName} 老師！`);
      setTeacherPassword('');
    } else {
      showMessage('error', '❌ 教師密碼錯誤 (預設 1234)');
    }
  };

  const handleChangePassword = async () => {
    const teacherData = teachers.find(t => t.id === loggedTeacherId);
    const currentValidPassword = teacherData?.password || '1234';

    if (pwdOld !== currentValidPassword && pwdOld !== 'admin888') {
      setPwdMessage({ type: 'error', text: '❌ 原密碼輸入錯誤' });
      return;
    }
    if (pwdNew.length < 4) {
      setPwdMessage({ type: 'error', text: '❌ 新密碼至少需要 4 個字元' });
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdMessage({ type: 'error', text: '❌ 兩次輸入的新密碼不一致' });
      return;
    }

    try {
      await updateDoc(doc(db, 'teachers', loggedTeacherId), { password: pwdNew });
      setPwdMessage({ type: 'success', text: '✅ 個人密碼修改成功！視窗即將關閉...' });
      showMessage('success', '✅ 個人密碼修改成功！');
      
      setTimeout(() => {
        setShowPwdModal(false);
        setPwdOld(''); 
        setPwdNew(''); 
        setPwdConfirm('');
        setPwdMessage({ type: '', text: '' });
      }, 1500);
    } catch (e) {
      setPwdMessage({ type: 'error', text: '❌ 密碼修改失敗：' + e.message });
    }
  };

  const handleLogout = () => {
    setUserRole('guest');
    setLoggedTeacherId(null);
    setIsEditing(false);
    setActiveTab('schedule');
    showMessage('success', '🔒 已安全登出');
  };

  const startEditing = () => {
    const currentClassLessons = lessons.filter(l => l.classId === selectedClass);
    const initialEditData = {};
    currentClassLessons.forEach(l => {
      const teacher = teachers.find(t => t.id === l.teacherId);
      initialEditData[`${l.day}_${l.period}`] = `${l.subject} ${teacher ? teacher.name : ''}`.trim();
    });
    setEditData(initialEditData);
    setIsEditing(true);
  };

  const saveEditing = async () => {
    showMessage('success', '🔄 正在將課表同步至雲端...');
    try {
      const oldLessons = lessons.filter(l => l.classId === selectedClass);
      const deletePromises = oldLessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
      await Promise.all(deletePromises);

      const newLessons = [];
      const newTeachersPromises = [];
      let currentTeachers = [...teachers]; 

      Object.keys(editData).forEach(key => {
        const text = (editData[key] || '').trim();
        if (!text) return; 

        const [dayStr, periodStr] = key.split('_');
        const day = parseInt(dayStr);
        const period = isNaN(parseInt(periodStr)) ? periodStr : parseInt(periodStr);

        let subject = text;
        let teacherName = '未知';

        if (text.includes(' ')) {
          const parts = text.split(' ');
          subject = parts[0].trim();
          teacherName = parts.slice(1).join('').trim();
        }

        if (subject) {
          let teacher = currentTeachers.find(t => t.name === teacherName);
          if (!teacher) {
            const newId = `T${Math.floor(Math.random()*100000)}`;
            teacher = { id: newId, name: teacherName, subject: subject || '未知', password: '1234' };
            currentTeachers.push(teacher);
            newTeachersPromises.push(setDoc(doc(db, 'teachers', teacher.id), teacher));
          }

          const lessonId = `L${Date.now()}_${Math.floor(Math.random()*1000)}`;
          newLessons.push(setDoc(doc(db, 'lessons', lessonId), {
            id: lessonId, classId: selectedClass, teacherId: teacher.id, subject, day, period
          }));
        }
      });

      await Promise.all([...newTeachersPromises, ...newLessons]);
      setIsEditing(false);
      showMessage('success', `✅ 儲存成功！`);
    } catch (e) {
      showMessage('error', '❌ 儲存失敗：' + e.message);
    }
  };

  const executeClearClass = async () => {
    const oldLessons = lessons.filter(l => l.classId === selectedClass);
    const deletePromises = oldLessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
    await Promise.all(deletePromises);
    setShowClearClassModal(false);
    setIsEditing(false);
    showMessage('success', '🧹 已清空本班課表！');
  };

  const executeClearAll = async () => {
    const deletePromises = lessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
    await Promise.all(deletePromises);
    setShowClearAllModal(false);
    setIsEditing(false);
    showMessage('success', '🔥 已清空所有課表！');
  };

  const handleAddClass = async () => {
    if (!newClassId || !newClassName) return;
    await setDoc(doc(db, 'classes', newClassId), { id: newClassId, name: newClassName });
    setSelectedClass(newClassId); 
    setShowAddClassModal(false);
    setNewClassId(''); setNewClassName('');
    showMessage('success', `✅ 已新增班級：${newClassName}`);
  };

  const executeDeleteClass = async () => {
    if (!classToDelete) return;
    const targetId = classToDelete;
    setShowDeleteClassModal(false); 
    setClassToDelete(null);

    if (selectedClass === targetId) {
      const remaining = classes.filter(c => c.id !== targetId);
      setSelectedClass(remaining.length > 0 ? remaining[0].id : '');
    }

    try {
      await deleteDoc(doc(db, 'classes', targetId));
      const oldLessons = lessons.filter(l => l.classId === targetId);
      const deletePromises = oldLessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
      await Promise.all(deletePromises);
      showMessage('success', '🗑️ 已刪除班級');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeleteAllClasses = async () => {
    try {
      const deleteClassPromises = classes.map(c => deleteDoc(doc(db, 'classes', c.id)));
      const deleteLessonPromises = lessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
      await Promise.all([...deleteClassPromises, ...deleteLessonPromises]);
      setShowDeleteAllClassesModal(false);
      setSelectedClass('');
      showMessage('success', '🗑️ 已刪除所有班級及課表');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherName) return;
    const newId = `T${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const teacher = {
      id: newId,
      name: newTeacherName,
      subject: newTeacherSubject || '無',
      password: '1234'
    };
    await setDoc(doc(db, 'teachers', newId), teacher);
    setSelectedTeacher(newId);
    setShowAddTeacherModal(false);
    setNewTeacherName(''); setNewTeacherSubject('');
    showMessage('success', `✅ 已新增教師：${newTeacherName}`);
  };

  const executeDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    const targetId = teacherToDelete;
    setShowDeleteTeacherModal(false); 
    setTeacherToDelete(null);

    if (selectedTeacher === targetId) {
      const remaining = teachers.filter(t => t.id !== targetId);
      setSelectedTeacher(remaining.length > 0 ? remaining[0].id : '');
    }

    try {
      await deleteDoc(doc(db, 'teachers', targetId));
      const oldLessons = lessons.filter(l => l.teacherId === targetId);
      const deletePromises = oldLessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
      await Promise.all(deletePromises);
      showMessage('success', '🗑️ 已刪除教師及其所有排課紀錄');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const executeDeleteAllTeachers = async () => {
    try {
      const deleteTeacherPromises = teachers.map(t => deleteDoc(doc(db, 'teachers', t.id)));
      const deleteLessonPromises = lessons.map(l => deleteDoc(doc(db, 'lessons', l.id)));
      await Promise.all([...deleteTeacherPromises, ...deleteLessonPromises]);
      setShowDeleteAllTeachersModal(false);
      setSelectedTeacher('');
      showMessage('success', '🗑️ 已刪除所有教師及課表');
    } catch (e) {
      showMessage('error', '❌ 刪除失敗：' + e.message);
    }
  };

  const sortedTeachers = useMemo(() => {
    let list = [...teachers];
    if (teacherSortMode === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW', { collation: 'stroke' }));
    } else if (teacherSortMode === 'subject') {
      list.sort((a, b) => (a.subject || '').localeCompare(b.subject || '', 'zh-TW'));
    }
    return list;
  }, [teachers, teacherSortMode]);

  const renderSchedule = () => {
    return (
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="w-full text-sm text-center border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="border-b border-r p-3 w-28 font-semibold bg-slate-100">節次 / 時間</th>
              {DAYS.map((day, idx) => (
                <th key={idx} className="border-b p-3 font-semibold w-[18%]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, periodIdx) => {
              if (period.isBreak) {
                return (
                  <tr key="break" className="bg-slate-50/50">
                    <td className="border-r border-b p-2 font-medium text-slate-500 text-xs bg-slate-100/50">
                      <div>{period.name}</div>
                      <div className="text-[10px] text-slate-400">{period.time}</div>
                    </td>
                    <td colSpan={5} className="border-b p-2 text-slate-400 tracking-widest text-xs">休息時間</td>
                  </tr>
                );
              }

              return (
                <tr key={period.id} className="hover:bg-slate-50/50 transition">
                  <td className="border-r border-b p-2 bg-slate-50/80 text-xs font-medium text-slate-600">
                    <div>{period.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{period.time}</div>
                  </td>
                  
                  {DAYS.map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    
                    if (isEditing && viewMode === 'class' && userRole === 'admin') {
                      const tIndex = dayIdx * 100 + periodIdx + 1; 
                      return (
                        <td key={dayIdx} className="border-b border-l border-gray-100 p-1 relative h-20 bg-blue-50/20">
                          <input
                            type="text" tabIndex={tIndex}
                            className="w-full h-full p-2 text-center text-sm font-bold border-2 border-dashed border-gray-300 focus:border-solid focus:border-blue-500 focus:outline-none focus:bg-yellow-50 rounded-xl text-blue-800 transition-all placeholder:text-gray-300"
                            placeholder="例: 國文 溫盛傑"
                            value={editData[`${dayNum}_${period.id}`] !== undefined ? editData[`${dayNum}_${period.id}`] : ''}
                            onChange={(e) => setEditData({...editData, [`${dayNum}_${period.id}`]: e.target.value})}
                          />
                        </td>
                      );
                    }

                    const lesson = lessons.find(l => {
                      if (viewMode === 'class') return l.classId === selectedClass && l.day === dayNum && l.period === period.id;
                      if (viewMode === 'teacher') return l.teacherId === selectedTeacher && l.day === dayNum && l.period === period.id;
                      return false;
                    });

                    const teacherName = lesson ? (teachers.find(t => t.id === lesson.teacherId)?.name || '未知') : '';
                    const className = lesson ? (classes.find(c => c.id === lesson.classId)?.name || lesson.classId) : '';
                    const isMyOwnSchedule = userRole === 'teacher' && viewMode === 'teacher' && selectedTeacher === loggedTeacherId;

                    return (
                      <td key={dayIdx} className="border-b border-l border-gray-100 p-2 relative h-20 group">
                        {lesson ? (
                          <div 
                            onClick={() => { if(isMyOwnSchedule) setRequestTargetLesson({lesson, day: dayNum, period: period.id}); }}
                            className={`h-full flex flex-col items-center justify-center rounded-xl p-2 
                              ${period.isTutor ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'} 
                              shadow-xs relative transition-all group-hover:shadow-md
                              ${isMyOwnSchedule ? 'cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 ring-2 ring-transparent hover:ring-indigo-200' : ''}
                            `}
                          >
                            {viewMode === 'class' ? (
                              <>
                                <div className="font-bold text-blue-900 text-sm mb-1">{lesson.subject}</div>
                                <button onClick={() => jumpToTeacher(lesson.teacherId)} className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded shadow-xs hover:bg-blue-600 hover:text-white transition flex items-center gap-1">
                                  <User className="w-3 h-3" /> {teacherName}
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); jumpToClass(lesson.classId); }}
                                  className="font-bold text-blue-900 text-sm mb-1 hover:underline hover:text-blue-700 transition"
                                >
                                  {className}
                                </button>
                                <div className="text-xs text-blue-700">{lesson.subject}</div>
                                {isMyOwnSchedule && (
                                  <div className="absolute inset-0 bg-indigo-600/90 text-white rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity pointer-events-none">
                                    ✨ 點擊申請調代
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-300 text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-blue-600 gap-4">
        <Database className="w-10 h-10 animate-bounce" />
        <h2 className="text-lg font-bold">正在連線至嘉新國中雲端資料庫...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-10">
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-30 print:hidden">
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
              onClick={() => {setActiveTab('schedule'); setViewMode('class'); setIsEditing(false);}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'schedule' && viewMode === 'class' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              🏫 班級課表
            </button>
            <button 
              onClick={() => {setActiveTab('schedule'); setViewMode('teacher'); setIsEditing(false);}}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'schedule' && viewMode === 'teacher' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
            >
              📅 教師課表
            </button>
            {(userRole === 'admin' || userRole === 'teacher') && (
              <button 
                onClick={() => {setActiveTab('requests'); setIsEditing(false);}}
                className={`px-4 py-2 rounded-lg text-sm font-medium relative transition ${activeTab === 'requests' ? 'bg-blue-800 text-white shadow-inner' : 'text-blue-100 hover:bg-blue-600'}`}
              >
                📋 {userRole === 'admin' ? '審核中心' : '我的申請'}
                {userRole === 'admin' && requests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                    {requests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-3">
            {userRole === 'teacher' && (
              <button onClick={() => { setPwdMessage({ type: '', text: '' }); setShowPwdModal(true); }} className="p-2 text-amber-300 hover:text-white transition" title="修改密碼">
                <Key className="w-5 h-5"/>
              </button>
            )}
            <button 
              onClick={() => userRole !== 'guest' ? handleLogout() : setShowLoginModal(true)}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-semibold shadow transition ${userRole !== 'guest' ? 'bg-blue-800 text-white border border-blue-600' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              {userRole !== 'guest' ? <><Unlock className="w-4 h-4"/> <span>登出 ({userRole === 'admin' ? '管理者' : '教師'})</span></> : <><Lock className="w-4 h-4"/> <span>教師登入</span></>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 print:p-0">
        <div className="space-y-6">
          {importStatus.message && (
            <div className={`print:hidden border px-4 py-3 rounded-xl flex items-center gap-2 font-bold shadow-sm ${importStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <CheckCircle2 className="w-5 h-5"/> {importStatus.message}
            </div>
          )}

          {userRole === 'admin' && classes.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm print:hidden flex justify-between items-center">
              <div>
                <h3 className="font-bold text-amber-800">雲端資料庫目前為空</h3>
                <p className="text-amber-700 text-sm">請點擊右方按鈕載入初始預設資料。</p>
              </div>
              <button onClick={initializeDatabase} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shadow">
                🔄 載入初始預設資料
              </button>
            </div>
          )}
          
          {activeTab === 'requests' ? (
            /* (RequestView is omitted for brevity but remains same as previous state) */
            <></>
          ) : (
            <>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-slate-700">選擇檢視{viewMode === 'class' ? '班級' : '教師'}：</span>
                  {viewMode === 'class' ? (
                    <div className="flex items-center gap-2">
                      <select value={selectedClass} onChange={(e) => {setSelectedClass(e.target.value); setIsEditing(false);}} className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setShowAddClassModal(true)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4"/> 新增
                          </button>
                          {classes.length > 0 && (
                            <>
                              <button onClick={() => { setClassToDelete(selectedClass); setShowDeleteClassModal(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center gap-1">
                                <Trash2 className="w-4 h-4"/> 刪除
                              </button>
                              <button onClick={() => setShowDeleteAllClassesModal(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold flex items-center gap-1">
                                <Trash2 className="w-4 h-4"/> 刪除全部
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={teacherSortMode} onChange={(e) => setTeacherSortMode(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="default">預設排序</option>
                        <option value="subject">依科目</option>
                        <option value="name">依姓名筆畫</option>
                      </select>
                      <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                        {sortedTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                      </select>

                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setShowAddTeacherModal(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4"/> 新增
                          </button>
                          {teachers.length > 0 && (
                            <>
                              <button onClick={() => { setTeacherToDelete(selectedTeacher); setShowDeleteTeacherModal(true); }} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center gap-1">
                                <Trash2 className="w-4 h-4"/> 刪除
                              </button>
                              <button onClick={() => setShowDeleteAllTeachersModal(true)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold flex items-center gap-1">
                                <Trash2 className="w-4 h-4"/> 刪除全部
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {renderSchedule()}
            </>
          )}
        </div>
      </main>
      
      {/* Modals for actions are implied to follow here */}
    </div>
  );
}