// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { tw } from '@twind/core';
import { API_BASE_URL } from '../api';

/* ───────────────────────── small fetch helper ───────────────────────── */
const api = (path, opts = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionStorage.getItem('app_token')}`,
      ...opts.headers,
    },
    ...opts,
  }).then((r) => r.json());

/* ───────────────────────── main component ───────────────────────────── */
const ProfilePage = () => {
  /* UI state */
  const [isManageMode, setIsManageMode] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showParentEditForm, setShowParentEditForm] = useState(false);
  const [editingParentRole, setEditingParentRole] = useState(null); // 'dad' or 'mom'
  const [formError, setFormError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showChildEditForm, setShowChildEditForm] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [childEditData, setChildEditData] = useState(null);
  const [parentFormStep, setParentFormStep] = useState(1); // 1 or 2 for multi-step form


  /* parents data - will be populated based on user profile */
  const [parents, setParents] = useState([]);

  /* kids pulled from API + live-added */
  const [kids, setKids] = useState([]);

  /* form data for new kid */
  const [childData, setChildData] = useState({
    firstName: '',
    lastName: '',
    nickName: '',
    username: '',
    avatar: '👧', // default girl
    birthDate: { day: '1', month: '1', year: '2015' },
    loginCode: ['', '', '', ''],
    confirmLoginCode: ['', '', '', ''],
  });

  /* form data for editing parent */
  const [parentEditData, setParentEditData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    parentRole: ''
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ───────── fetch user profile and existing kids on mount ───────── */
  useEffect(() => {
    (async () => {
      try {
        // Fetch user profile
        const profileRes = await api('/api/users/profile');
        if (profileRes.success) {
          setUserProfile(profileRes.user);
          
          // Build parents list from user profile
          const parentsList = [];
          
          // Check if user has parents array (new format)
          if (profileRes.user.parents && profileRes.user.parents.length > 0) {
            // Use parents array
            profileRes.user.parents.forEach(parent => {
              parentsList.push({
                id: parent.role === 'dad' ? 1 : 2,
                name: parent.name,
                avatar: parent.role === 'dad' ? '👨‍💼' : '👩‍💼',
                role: parent.role,
                ...parent
              });
            });
          } else {
            // Fallback to old format for backward compatibility
            // Add current user as parent
            if (profileRes.user.parentRole && profileRes.user.name) {
              if (profileRes.user.parentRole === 'dad') {
                parentsList.push({
                  id: 1,
                  name: profileRes.user.name,
                  avatar: '👨‍💼',
                  role: 'dad',
                  firstName: profileRes.user.firstName,
                  lastName: profileRes.user.lastName,
                  phoneNumber: profileRes.user.phoneNumber,
                  birthDate: profileRes.user.birthDate
                });
              } else if (profileRes.user.parentRole === 'mom') {
                parentsList.push({
                  id: 2,
                  name: profileRes.user.name,
                  avatar: '👩‍💼',
                  role: 'mom',
                  firstName: profileRes.user.firstName,
                  lastName: profileRes.user.lastName,
                  phoneNumber: profileRes.user.phoneNumber,
                  birthDate: profileRes.user.birthDate
                });
              }
            }
            
            // Add spouse if exists (old format)
            if (profileRes.user.spouse) {
              const spouseRole = profileRes.user.parentRole === 'dad' ? 'mom' : 'dad';
              parentsList.push({
                id: spouseRole === 'dad' ? 1 : 2,
                name: profileRes.user.spouse.name,
                avatar: spouseRole === 'dad' ? '👨‍💼' : '👩‍💼',
                role: spouseRole,
                ...profileRes.user.spouse
              });
            }
          }
          
          // Sort by id to maintain consistent order
          setParents(parentsList.sort((a, b) => a.id - b.id));
          
          // Set edit form data
          setParentEditData({
            firstName: profileRes.user.firstName || '',
            lastName: profileRes.user.lastName || '',
            phoneNumber: profileRes.user.phoneNumber || '',
            birthDate: profileRes.user.birthDate || '',
            parentRole: profileRes.user.parentRole || ''
          });
        }
        
        // Fetch kids
        const res = await api('/api/users/children');
        if (res.success) setKids(res.children.map((c) => ({ ...c, avatar: c.avatar || '👧' })));
      } catch (e) {
        console.error('Could not load data', e);
      }
    })();
  }, []);

  /* ───────── focus-jump handlers for 4-digit code ───────── */
  const handleCodeChange = (idx, val) => {
    if (val.length <= 1 && /^[0-9]*$/.test(val)) {
      const copy = [...childData.loginCode];
      copy[idx] = val;
      setChildData({ ...childData, loginCode: copy });
      if (val && idx < 3) document.getElementById(`child-code-${idx + 1}`)?.focus();
    }
  };
  const handleConfirmCodeChange = (idx, val) => {
    if (val.length <= 1 && /^[0-9]*$/.test(val)) {
      const copy = [...childData.confirmLoginCode];
      copy[idx] = val;
      setChildData({ ...childData, confirmLoginCode: copy });
      if (val && idx < 3) document.getElementById(`confirm-code-${idx + 1}`)?.focus();
    }
  };

  /* ───────── save new kid ───────── */
  const handleSaveChild = async (e) => {
    e.preventDefault();

    if (childData.loginCode.join('') !== childData.confirmLoginCode.join('')) {
      setFormError('Login code and Confirm code do not match!');
      return;
    }
    setFormError('');

    const { day, month, year } = childData.birthDate;
    try {
      const res = await api('/api/users/children', {
        method: 'POST',
        body: JSON.stringify({
          firstName: childData.firstName.trim(),
          lastName: childData.lastName.trim(),
          nickName: childData.nickName.trim(),
          username: childData.username.trim(),
          avatar: childData.avatar,
          birthDate: `${year}-${month}-${day}`,
          loginCode: childData.loginCode.join(''),
        }),
      });
      if (!res.success) throw new Error(res.error || 'Unknown error');

      /* push into UI list */
      setKids((prev) => [...prev, { ...res.child, avatar: childData.avatar }]);

      /* reset + close */
      setChildData({
        firstName: '',
        lastName: '',
        nickName: '',
        username: '',
        avatar: '👧',
        birthDate: { day: '1', month: '1', year: '2015' },
        loginCode: ['', '', '', ''],
        confirmLoginCode: ['', '', '', ''],
      });
      setShowChildForm(false);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSaveChildEdit = async (e) => {
  e.preventDefault();

  if (childEditData.loginCode.join('') !== childEditData.confirmLoginCode.join('')) {
    setFormError('Login code and Confirm code do not match!');
    return;
  }
  setFormError('');

  const { day, month, year } = childEditData.birthDate;

  try {
    const res = await api(`/api/users/children/${editingChild.username}`, {
      method: 'PUT',
      body: JSON.stringify({
        firstName: childEditData.firstName.trim(),
        lastName: childEditData.lastName.trim(),
        nickName: childEditData.nickName.trim(),
        username: childEditData.username.trim(),
        avatar: childEditData.avatar,
        birthDate: `${year}-${month}-${day}`,
        loginCode: childEditData.loginCode.join(''),
      }),
    });
    if (!res.success) throw new Error(res.error || 'Update failed');

    // update child in local state
    setKids((prev) =>
      prev.map((kid) => (kid.id === editingChild.id ? { ...res.child, avatar: childEditData.avatar } : kid))
    );

    setShowChildEditForm(false);
    setEditingChild(null);
  } catch (err) {
    setFormError(err.message);
  }
};

const handleChildEdit = (kid) => {
  setEditingChild(kid);
  const [year, month, day] = (kid.birthDate || '2015-01-01').split('-');
  setChildEditData({
    firstName: kid.firstName || '',
    lastName: kid.lastName || '',
    nickName: kid.nickName || '',
    username: kid.username || '',
    avatar: kid.avatar || '👧',
    birthDate: { day, month, year },
    loginCode: kid.loginCode ? kid.loginCode.split('') : ['', '', '', ''],
    confirmLoginCode: kid.loginCode ? kid.loginCode.split('') : ['', '', '', ''],
  });
  setFormError('');
  setShowChildEditForm(true);
};



  /* ───────── logout ───────── */
  const handleLogout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    sessionStorage.clear();
    dispatch(logout());
    navigate('/');
  };

  /* ───────── save parent edit ───────── */
  const handleSaveParentEdit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const updatedName = `${parentEditData.firstName} ${parentEditData.lastName}`;
      
      // Create parent data object
      const parentData = {
        name: updatedName,
        firstName: parentEditData.firstName,
        lastName: parentEditData.lastName,
        phoneNumber: parentEditData.phoneNumber,
        birthDate: parentEditData.birthDate,
        role: editingParentRole
      };
      
      // Build the complete parents array
      let allParents = [...parents];
      
      // Check if we're updating an existing parent or adding a new one
      const existingIndex = allParents.findIndex(p => p.role === editingParentRole);
      
      if (existingIndex >= 0) {
        // Update existing parent
        allParents[existingIndex] = {
          ...allParents[existingIndex],
          ...parentData,
          id: editingParentRole === 'dad' ? 1 : 2,
          avatar: editingParentRole === 'dad' ? '👨‍💼' : '👩‍💼'
        };
      } else {
        // Add new parent
        allParents.push({
          id: editingParentRole === 'dad' ? 1 : 2,
          avatar: editingParentRole === 'dad' ? '👨‍💼' : '👩‍💼',
          ...parentData
        });
      }
      
      // Sort by id to maintain order
      allParents.sort((a, b) => a.id - b.id);
      
      // Prepare data for backend
      const parentsForBackend = allParents.map(p => ({
        name: p.name,
        firstName: p.firstName,
        lastName: p.lastName,
        phoneNumber: p.phoneNumber,
        birthDate: p.birthDate,
        role: p.role
      }));
      
      // If editing current user's profile, also update their personal info
      if (editingParentRole === userProfile?.parentRole) {
        const res = await api('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify({
            firstName: parentEditData.firstName,
            lastName: parentEditData.lastName,
            phoneNumber: parentEditData.phoneNumber,
            birthDate: parentEditData.birthDate,
            parentRole: parentEditData.parentRole,
            parents: parentsForBackend
          }),
        });
        
        if (!res.success) throw new Error(res.error || 'Update failed');
        
        // Update local state
        setUserProfile({ 
          ...userProfile, 
          ...parentEditData,
          parents: parentsForBackend
        });
      } else {
        // Just updating parents array
        const res = await api('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ 
            parents: parentsForBackend 
          }),
        });
        
        if (!res.success) throw new Error(res.error || 'Update failed');
        
        // Update local state
        setUserProfile({ 
          ...userProfile, 
          parents: parentsForBackend
        });
      }
      
      // Update parents display
      setParents(allParents);

      setShowParentEditForm(false);
      setEditingParentRole(null);
      setParentFormStep(1); // Reset to step 1 for next time
    } catch (err) {
      setFormError(err.message);
    }
  };

  /* ───────── handle parent click ───────── */
  const handleParentClick = (parent) => {
    console.log('Parent clicked:', parent);
    console.log('isManageMode:', isManageMode);
    if (!isManageMode) {
      // Navigate to kid selection page when clicking on any parent avatar
      console.log('Navigating to kid selection...');
      navigate('/kid-selection', { 
        state: { 
          parent: {
            name: parent.name,
            role: parent.role,
            avatar: parent.avatar
          }
        } 
      });
    }
  };

  /* ───────── handle parent edit/add ───────── */
  const handleParentAction = (parent) => {
    if (parent) {
      // Editing existing parent
      setEditingParentRole(parent.role);
      
      // Find the parent data from the parents array
      const parentFromArray = parents.find(p => p.role === parent.role);
      
      if (parentFromArray) {
        setParentEditData({
          firstName: parentFromArray.firstName || '',
          lastName: parentFromArray.lastName || '',
          phoneNumber: parentFromArray.phoneNumber || '',
          birthDate: parentFromArray.birthDate || '',
          parentRole: parent.role
        });
      } else {
        // Fallback if not found
        setParentEditData({
          firstName: '',
          lastName: '',
          phoneNumber: '',
          birthDate: '',
          parentRole: parent.role
        });
      }
    } else {
      // Adding new parent - determine which role is available
      const hasDad = parents.some(p => p.role === 'dad');
      const hasMom = parents.some(p => p.role === 'mom');
      
      let newRole;
      if (!hasDad && !hasMom) {
        // No parents yet, use user's role or default to dad
        newRole = userProfile?.parentRole || 'dad';
      } else if (!hasDad) {
        newRole = 'dad';
      } else if (!hasMom) {
        newRole = 'mom';
      } else {
        // Both slots filled
        return;
      }
      
      setEditingParentRole(newRole);
      setParentEditData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        birthDate: '',
        parentRole: newRole
      });
    }
    
    setShowParentEditForm(true);
  };



  /* ─────────────────────── render ─────────────────────── */
  return (
    <div className={tw('min-h-screen bg-gradient-to-br from-primary-turquoise to-primary-turquoise-dark')}>
      {/* Header */}
      <Header onLogout={handleLogout} />

      {/* Main card */}
      <div className={tw('flex items-center justify-center min-h-[calc(100vh-5rem)] py-12')}>
        <div className={tw('max-w-4xl w-full')}>
          <div className={tw('bg-white rounded-2xl shadow-xl p-8')}>
            {/* Parents header */}
            <div className={tw('flex items-center justify-between mb-8')}>
              <h2 className={tw('text-2xl font-bold text-gray-800')}>Parents</h2>
              {!isManageMode ? (
                <button
                  onClick={() => setIsManageMode(true)}
                  className={tw(
                    'flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300',
                  )}
                >
                  ⚙️ Manage profiles
                </button>
              ) : (
                <button
                  onClick={() => setIsManageMode(false)}
                  className={tw(
                    'px-4 py-2 bg-white border-2 border-primary-turquoise text-primary-turquoise rounded-lg hover:bg-primary-turquoise hover:text-white transition-colors',
                  )}
                >
                  Save
                </button>
              )}
            </div>

            {/* Parents grid (dynamic based on user) */}
            <AvatarGrid 
              items={parents} 
              isManage={isManageMode} 
              addLabel="Add parent"
              onEdit={handleParentAction}
              onClick={handleParentClick}
              onAdd={() => {
                // Check if we can add more parents (max 2)
                if (parents.length < 2) {
                  handleParentAction(null);
                }
              }}
              showAddButton={true} // Show add button for parents too
              maxItems={2} // Maximum 2 parents
            />

            {/* Kids */}
            <h3 className={tw('text-xl font-bold text-gray-800 mb-6')}>Kids</h3>
            <AvatarGrid
                items={kids.map((k) => ({
                    id: k.id,
                    name: k.nickName || k.firstName,
                    avatar: k.avatar || '👧',
                    ...k,
                }))}
                isManage={isManageMode}
                addLabel="Add kid profile"
                onAdd={() => setShowChildForm(true)}
                onEdit={handleChildEdit}
                showAddButton={true}
            />

          </div>
        </div>
      </div>

      {/* Add-Kid Modal */}
      {showChildForm && (
        <Modal onClose={() => setShowChildForm(false)}>
          {/* pink stats card */}
          <PinkStatsCard avatar={childData.avatar} />

          {/* form */}
          <form onSubmit={handleSaveChild}>
            <NameInputs childData={childData} setChildData={setChildData} />
            <NicknameInput childData={childData} setChildData={setChildData} />
            <UsernameInput childData={childData} setChildData={setChildData} />

            {/* avatar selector */}
            <div className={tw('mb-4')}>
              <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Avatar (boy / girl)</label>
              <select
                value={childData.avatar}
                onChange={(e) => setChildData({ ...childData, avatar: e.target.value })}
                className={tw(
                  'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
                )}
              >
                <option value="👧">Girl (👧)</option>
                <option value="👦">Boy (👦)</option>
              </select>
            </div>

            <DOBInputs childData={childData} setChildData={setChildData} />
            <CodeInputRow
              label="Kid login code"
              idBase="child-code"
              codeArray={childData.loginCode}
              handleChange={handleCodeChange}
            />
            <CodeInputRow
              label="Confirm login code"
              idBase="confirm-code"
              codeArray={childData.confirmLoginCode}
              handleChange={handleConfirmCodeChange}
            />
            {formError && <p className={tw('text-sm text-red-600 text-center mb-4')}>{formError}</p>}
            <SubmitButton />
          </form>
        </Modal>
      )}

      {/* Edit Parent Modal - New Design */}
      {showParentEditForm && (
        <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
          <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col')}>
            {/* Header */}
            <div className={tw('bg-white rounded-t-2xl p-6 border-b border-gray-200 flex-shrink-0')}>
              <div className={tw('flex items-center justify-between')}>
                <div className={tw('flex items-center space-x-2')}>
                  <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
                  <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
                </div>
                <button
                  onClick={() => {
                    setShowParentEditForm(false);
                    setEditingParentRole(null);
                    setParentFormStep(1);
                  }}
                  className={tw('text-gray-400 hover:text-gray-600')}
                >
                  <svg className={tw('w-6 h-6')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className={tw('p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100')} style={{ maxHeight: 'calc(90vh - 100px)' }}>
              {parentFormStep === 1 ? (
                <>
                  <h2 className={tw('text-2xl font-bold text-center mb-2')}>Personal Information</h2>
                  <p className={tw('text-gray-600 text-center mb-8')}>Tell us about yourself</p>

                  {/* Progress Bar */}
                  <div className={tw('relative mb-8')}>
                    <div className={tw('h-2 bg-gray-200 rounded-full')}>
                      <div className={tw('h-full w-1/2 bg-gradient-to-r from-primary-turquoise to-accent-purple rounded-full')} />
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className={tw('bg-primary-turquoise/10 rounded-xl p-6 mb-8 text-center')}>
                    <p className={tw('text-gray-700')}>
                      Welcome to AIDIY!<br />
                      Lets set up your profile to help children learn about<br />
                      money through fun chores and education activities!
                    </p>
                  </div>

                  {/* Avatar Section */}
                  <div className={tw('flex justify-center mb-8')}>
                    <div className={tw('relative')}>
                      <div className={tw('w-32 h-32 rounded-full bg-gradient-to-r from-primary-turquoise to-accent-purple p-1')}>
                        <div className={tw('w-full h-full rounded-full bg-white flex items-center justify-center')}>
                          <span className={tw('text-6xl')}>
                            {editingParentRole === 'dad' ? '👨' : '👩'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={tw('absolute bottom-0 right-0 w-10 h-10 bg-accent-purple rounded-full flex items-center justify-center text-white hover:bg-accent-purple-dark transition-colors')}
                      >
                        📷
                      </button>
                    </div>
                  </div>

                  {/* Form Step 1 */}
                  <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-6 mb-6')}>
                    <div>
                      <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                        <span>👤</span> First Name*
                      </label>
                      <input
                        type="text"
                        value={parentEditData.firstName}
                        onChange={(e) => setParentEditData({ ...parentEditData, firstName: e.target.value })}
                        placeholder="Enter your first name"
                        className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                        Last Name*
                      </label>
                      <input
                        type="text"
                        value={parentEditData.lastName}
                        onChange={(e) => setParentEditData({ ...parentEditData, lastName: e.target.value })}
                        placeholder="Enter your last name"
                        className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                        required
                      />
                    </div>

                    <div>
                      <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                        <span>✉️</span> Email Address*
                      </label>
                      <input
                        type="email"
                        value={userProfile?.email || ''}
                        placeholder="Enter your email address"
                        className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                        disabled
                      />
                    </div>

                    <div>
                      <label className={tw('flex items-center gap-2 text-gray-700 font-medium mb-2')}>
                        <span>📍</span> Location
                      </label>
                      <input
                        type="text"
                        value={parentEditData.phoneNumber}
                        onChange={(e) => setParentEditData({ ...parentEditData, phoneNumber: e.target.value })}
                        placeholder="Enter your location"
                        className={tw('w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors')}
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className={tw('text-red-600 text-sm text-center mb-4')}>
                      {formError}
                    </div>
                  )}

                  <div className={tw('flex justify-end')}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!parentEditData.firstName || !parentEditData.lastName) {
                          setFormError('Please fill in all required fields');
                          return;
                        }
                        setFormError('');
                        setParentFormStep(2);
                      }}
                      className={tw('px-8 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={tw('text-2xl font-bold text-center mb-2')}>Family & Money Goals</h2>
                  <p className={tw('text-gray-600 text-center mb-8')}>Help us understand your family's money learning goals</p>

                  {/* Progress Bar */}
                  <div className={tw('relative mb-8')}>
                    <div className={tw('h-2 bg-gray-200 rounded-full')}>
                      <div className={tw('h-full w-full bg-gradient-to-r from-primary-turquoise to-accent-purple rounded-full')} />
                    </div>
                  </div>

                  {/* AIDIY Logo */}
                  <div className={tw('flex justify-center mb-6')}>
                    <div className={tw('w-24 h-24 rounded-full bg-gradient-to-r from-primary-turquoise to-accent-purple flex items-center justify-center')}>
                      <span className={tw('text-4xl')}>🎯</span>
                    </div>
                  </div>
                  <p className={tw('text-center text-lg font-semibold mb-8')}>
                    AIDIY<br />
                    Making kids money smart
                  </p>

                  {/* Form Step 2 */}
                  <form onSubmit={handleSaveParentEdit}>
                    {/* Your Children */}
                    <div className={tw('bg-blue-50 rounded-xl p-6 mb-6')}>
                      <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                        <span>👶</span> Your Children
                      </h3>
                      <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4')}>
                        <div>
                          <label className={tw('block text-sm text-gray-700 mb-2')}>
                            Number of Children*
                          </label>
                          <select className={tw('w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}>
                            <option value="">Select number</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4+">4+</option>
                          </select>
                        </div>
                        <div>
                          <label className={tw('block text-sm text-gray-700 mb-2')}>
                            Children's Ages
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 5, 8, 12"
                            className={tw('w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Money Learning Goals */}
                    <div className={tw('bg-green-50 rounded-xl p-6 mb-6')}>
                      <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                        <span>🎯</span> Money Learning Goals
                      </h3>
                      <p className={tw('text-sm text-gray-600 mb-4')}>What money skills do you want your children to learn?</p>
                      <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-3')}>
                        {['Teaching Saving Habits', 'Learn to Budget', 'Smart Spending Decisions', 
                          'Understanding Money Value', 'Earning Through Chores', 'Banking Basics'].map((goal) => (
                          <label key={goal} className={tw('flex items-center gap-2 cursor-pointer')}>
                            <input type="checkbox" className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')} />
                            <span className={tw('text-gray-700')}>{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Weekly Allowance & Learning Focus */}
                    <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-6 mb-6')}>
                      <div className={tw('bg-yellow-50 rounded-xl p-6')}>
                        <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                          <span>💰</span> Weekly Allowance
                        </h3>
                        <label className={tw('block text-sm text-gray-700 mb-2')}>
                          Amount per child (optional)
                        </label>
                        <div className={tw('relative')}>
                          <span className={tw('absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500')}>$</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            className={tw('w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise')}
                          />
                        </div>
                      </div>

                      <div className={tw('bg-purple-50 rounded-xl p-6')}>
                        <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                          <span>🎯</span> Learning Focus
                        </h3>
                        <div className={tw('space-y-2')}>
                          {['Coins & Bills Recognition', 'Saving vs Spending', 'Needs vs Wants'].map((focus) => (
                            <label key={focus} className={tw('flex items-center gap-2 cursor-pointer')}>
                              <input type="checkbox" className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')} />
                              <span className={tw('text-gray-700 text-sm')}>{focus}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Chore Categories */}
                    <div className={tw('bg-blue-50 rounded-xl p-6 mb-8')}>
                      <h3 className={tw('flex items-center gap-2 text-lg font-semibold mb-4')}>
                        <span>📋</span> Chore Categories
                      </h3>
                      <p className={tw('text-sm text-gray-600 mb-4')}>What type of chores would you like AIDIY to suggest?</p>
                      <div className={tw('grid grid-cols-2 md:grid-cols-3 gap-3')}>
                        {['Household Cleaning', 'Pet Care', 'Kitchen Help', 'Garden Work', 'Organizing Rooms', 'Laundry Help'].map((chore) => (
                          <label key={chore} className={tw('flex items-center gap-2 cursor-pointer')}>
                            <input type="checkbox" className={tw('w-5 h-5 text-primary-turquoise rounded focus:ring-primary-turquoise')} />
                            <span className={tw('text-gray-700 text-sm')}>{chore}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formError && (
                      <div className={tw('text-red-600 text-sm text-center mb-4')}>
                        {formError}
                      </div>
                    )}

                    <div className={tw('flex justify-between')}>
                      <button
                        type="button"
                        onClick={() => setParentFormStep(1)}
                        className={tw('px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors')}
                      >
                        ← Previous
                      </button>
                      <button
                        type="submit"
                        className={tw('px-8 py-3 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all')}
                      >
                        Start AI DIY Journey
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Edit-Kid Modal */}
{showChildEditForm && editingChild && (
  <Modal
    onClose={() => {
      setShowChildEditForm(false);
      setEditingChild(null);
    }}
  >
    <PinkStatsCard avatar={childEditData.avatar} />
    <form onSubmit={handleSaveChildEdit}>
      <NameInputs childData={childEditData} setChildData={setChildEditData} />
      <NicknameInput childData={childEditData} setChildData={setChildEditData} />
      <UsernameInput childData={childEditData} setChildData={setChildEditData} />

      <div className={tw('mb-4')}>
        <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Avatar (boy / girl)</label>
        <select
          value={childEditData.avatar}
          onChange={(e) => setChildEditData({ ...childEditData, avatar: e.target.value })}
          className={tw(
            'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
        >
          <option value="👧">Girl (👧)</option>
          <option value="👦">Boy (👦)</option>
        </select>
      </div>

      <DOBInputs childData={childEditData} setChildData={setChildEditData} />
      <CodeInputRow
        label="Kid login code"
        idBase="child-code-edit"
        codeArray={childEditData.loginCode}
        handleChange={(idx, val) => {
          if (val.length <= 1 && /^[0-9]*$/.test(val)) {
            const copy = [...childEditData.loginCode];
            copy[idx] = val;
            setChildEditData({ ...childEditData, loginCode: copy });
            if (val && idx < 3) document.getElementById(`child-code-edit-${idx + 1}`)?.focus();
          }
        }}
      />
      <CodeInputRow
        label="Confirm login code"
        idBase="confirm-code-edit"
        codeArray={childEditData.confirmLoginCode}
        handleChange={(idx, val) => {
          if (val.length <= 1 && /^[0-9]*$/.test(val)) {
            const copy = [...childEditData.confirmLoginCode];
            copy[idx] = val;
            setChildEditData({ ...childEditData, confirmLoginCode: copy });
            if (val && idx < 3) document.getElementById(`confirm-code-edit-${idx + 1}`)?.focus();
          }
        }}
      />
      {formError && <p className={tw('text-sm text-red-600 text-center mb-4')}>{formError}</p>}
      <SubmitButton />
    </form>
  </Modal>
)}

    </div>
  );
};



/* ────────── reusable UI pieces ────────── */

const Header = ({ onLogout }) => (
  <header className={tw('bg-white shadow-sm')}>
    <div className={tw('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8')}>
      <div className={tw('flex items-center justify-between h-20')}>
        <Link to="/" className={tw('flex items-center space-x-2')}>
          <span className={tw('text-3xl font-bold text-primary-turquoise')}>AI</span>
          <span className={tw('text-3xl font-bold text-accent-purple')}>DIY</span>
        </Link>
        <button
          onClick={onLogout}
          className={tw(
            'px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:border-primary-turquoise hover:text-primary-turquoise transition-colors',
          )}
        >
          Logout
        </button>
      </div>
    </div>
  </header>
);

const AvatarGrid = ({ items, isManage, addLabel, onEdit, onClick, onAdd, showAddButton = true, maxItems = null }) => (
  <div className={tw('mb-12')}>
    <div className={tw('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6')}>
      {items.map((p) => (
        <div key={p.id} className={tw('text-center')}>
          <div
            onClick={() => {
              if (isManage && onEdit) {
                onEdit(p);
              } else if (!isManage && onClick) {
                onClick(p);
              }
            }}
            className={tw(
              `relative w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center border-3 transition-all duration-300 bg-accent-pink border-transparent ${
                isManage || onClick ? 'hover:border-primary-turquoise cursor-pointer' : ''
              } ${!isManage && onClick ? 'hover:scale-110' : ''}`,
            )}
          >
            <span className={tw('text-3xl')}>{p.avatar}</span>
            {isManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(p);
                }}
                className={tw(
                  'absolute -top-1 -right-1 w-6 h-6 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-xs',
                )}
              >
                ✏️
              </button>
            )}
          </div>
          <p className={tw('text-sm font-medium text-gray-700')}>{p.name}</p>
        </div>
      ))}
      {/* Show add button if in manage mode and haven't reached max items */}
      {isManage && onAdd && showAddButton && (!maxItems || items.length < maxItems) && (
        <div onClick={onAdd} className={tw('text-center cursor-pointer group')}>
          <div
            className={tw(
              'w-20 h-20 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 group-hover:border-primary-turquoise transition-colors',
            )}
          >
            <span className={tw('text-2xl text-gray-400')}>+</span>
          </div>
          <p className={tw('text-sm text-gray-500')}>{addLabel}</p>
        </div>
      )}
    </div>
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className={tw('fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4')}>
    <div className={tw('bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto')}>
      <div className={tw('flex items-center justify-between p-6 border-b border-gray-200')}>
        <h3 className={tw('text-xl font-bold text-gray-800')}>Account Settings</h3>
        <button
          onClick={onClose}
          className={tw('w-10 h-10  hover:bg-gray-100 flex items-center justify-center text-2xl text-gray-500')}
        >
          ×
        </button>
      </div>
      <div className={tw('p-6')}><div className={tw('flex flex-col md:flex-row gap-8')}>
    {children}
  </div></div>
    </div>
  </div>
);

/* pink card with dummy stats */
const PinkStatsCard = ({ avatar }) => (
  
  <div
  className={tw('grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6 mb-8 p-6')}
  style={{ backgroundColor: '#F8ECFF' }}
>
    <div className={tw('relative')}>
      <div className={tw('w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg')}>
        <span className={tw('text-4xl')}>{avatar}</span>
      </div>
      {/* optional edit icon */}
      <button
        className={tw(
          'absolute bottom-0 right-0 w-8 h-8 bg-primary-turquoise text-white rounded-full flex items-center justify-center text-sm',
        )}
      >
        ✏️
      </button>
    </div>
    <div className={tw('space-y-3')}>
      <Stat label="Money Accumulated" value="$ 0" />
      <Stat label="Tasks Assigned" value="0" />
      <Stat label="Tasks Completed" value="0" />
    </div>
  </div>
);

/* plain stat row */
const Stat = ({ label, value }) => (
  <div className={tw('flex justify-between items-center')}>
    <span className={tw('text-sm text-gray-600')}>{label}</span>
    <span className={tw('text-sm font-semibold text-gray-800')}>{value}</span>
  </div>
);

/* form chunks */
const NameInputs = ({ childData, setChildData }) => (
  <div className={tw('grid grid-cols-1 md:grid-cols-2 gap-4 mb-4')}>
    {['firstName', 'lastName'].map((field) => (
      <div key={field}>
        <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>
          {field === 'firstName' ? 'First Name' : 'Last Name'}
        </label>
        <input
          type="text"
          placeholder={field === 'firstName' ? 'Tanya' : 'Makan'}
          value={childData[field]}
          onChange={(e) => setChildData({ ...childData, [field]: e.target.value })}
          className={tw(
            'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
          required
        />
      </div>
    ))}
  </div>
);

const NicknameInput = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Nick name</label>
    <input
      type="text"
      placeholder="Sweety"
      value={childData.nickName}
      onChange={(e) => setChildData({ ...childData, nickName: e.target.value })}
      className={tw(
        'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
      )}
    />
  </div>
);

const UsernameInput = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>User name </label>
    <input
      type="text"
      placeholder="sweety123"
      value={childData.username}
      onChange={(e) => setChildData({ ...childData, username: e.target.value })}
      className={tw(
        'w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
      )}
      required
    />
  </div>
);

const DOBInputs = ({ childData, setChildData }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>Date of Birth</label>
    <div className={tw('flex gap-2')}>
      {['day', 'month', 'year'].map((unit) => (
        <select
          key={unit}
          value={childData.birthDate[unit]}
          onChange={(e) =>
            setChildData({
              ...childData,
              birthDate: { ...childData.birthDate, [unit]: e.target.value },
            })
          }
          className={tw(
            'flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
        >
          {unit === 'year'
            ? [...Array(20)].map((_, i) => {
                const y = 2025 - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })
            : [...Array(unit === 'month' ? 12 : 31)].map((_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ))}
        </select>
      ))}
    </div>
  </div>
);

const CodeInputRow = ({ label, idBase, codeArray, handleChange }) => (
  <div className={tw('mb-4')}>
    <label className={tw('block text-sm font-medium text-gray-700 mb-2')}>{label}</label>
    <div className={tw('flex gap-2')}>
      {codeArray.map((d, idx) => (
        <input
          key={idx}
          id={`${idBase}-${idx}`}
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(idx, e.target.value)}
          className={tw(
            'w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-turquoise transition-colors',
          )}
          type="text"
          required
        />
      ))}
    </div>
  </div>
);

const SubmitButton = () => (
  <div className={tw('text-center')}>
    <button
      type="submit"
      className={tw(
        'px-8 py-3 bg-gradient-to-r from-primary-turquoise to-primary-turquoise-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300',
      )}
    >
      Save changes
    </button>
  </div>
);

export default ProfilePage;
