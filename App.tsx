
import React, { useState, useEffect, useMemo } from 'react';
import { FormData, FormStatus } from './types';
import { Star, Check, Info } from './components/Icons';
import { generateEmailHTML } from './components/EmailTemplate';

const THALES_PRIMARY = '#0075B9';
const THALES_SECONDARY = '#1CB3E7';
const ADMIN_PASSWORD = 'Thales2025'; // Mot de passe par défaut

const App: React.FC = () => {
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalTab, setModalTab] = useState<'email' | 'sheet'>('email');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('thales_admin_auth') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Données pour le dashboard
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Configuration Google Sheet
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => {
    return localStorage.getItem('thales_jpo_sheet_url') || '';
  });

  useEffect(() => {
    localStorage.setItem('thales_jpo_sheet_url', googleSheetUrl);
  }, [googleSheetUrl]);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    globalSatisfaction: 0,
    orgQuality: 0,
    logistics: 0,
    timing: 0,
    relevance: 0,
    clarity: 0,
    interest: 0,
    positivePoints: '',
    improvements: '',
    recommendation: '',
    nps: 5,
    optInContact: false,
  });

  const [errors, setErrors] = useState<{ email?: string; submit?: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'email' && errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handleRating = (name: keyof FormData, rating: number) => {
    setFormData(prev => ({ ...prev, [name]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.optInContact && !formData.email) {
      setErrors({ email: "L'email est requis pour être recontacté." });
      return;
    }
    setStatus(FormStatus.SUBMITTING);
    if (googleSheetUrl) {
      try {
        await fetch(googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, timestamp: new Date().toISOString() })
        });
        setStatus(FormStatus.SUCCESS);
      } catch (err) {
        setErrors({ submit: "Erreur lors de l'envoi." });
        setStatus(FormStatus.ERROR);
      }
    } else {
      setTimeout(() => setStatus(FormStatus.SUCCESS), 1500);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginError(false);
      sessionStorage.setItem('thales_admin_auth', 'true');
      fetchDashboardData();
    } else {
      setLoginError(true);
      setPasswordInput('');
    }
  };

  const fetchDashboardData = async () => {
    if (!googleSheetUrl) return;
    setIsLoadingData(true);
    try {
      // Pour le GET, Google Apps Script nécessite de suivre les redirections
      const response = await fetch(`${googleSheetUrl}?action=getData`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setSheetData(data);
      }
    } catch (err) {
      console.error("Erreur fetch dashboard:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Calculs statistiques
  const stats = useMemo(() => {
    if (sheetData.length === 0) return null;
    const total = sheetData.length;
    const avg = (key: string) => sheetData.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / total;
    
    // NPS Calculation
    const promoters = sheetData.filter(d => Number(d.nps) >= 9).length;
    const detractors = sheetData.filter(d => Number(d.nps) <= 6).length;
    const npsScore = Math.round(((promoters - detractors) / total) * 100);

    // Recommandations
    const recos = {
      Oui: sheetData.filter(d => d.recommendation === 'Oui').length,
      Non: sheetData.filter(d => d.recommendation === 'Non').length,
      Maybe: sheetData.filter(d => d.recommendation === 'Peut-être').length,
    };

    return { total, avg, npsScore, recos };
  }, [sheetData]);

  const appsScriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(["Date", "Prénom", "Nom", "Entreprise", "Email", "Satisf_Globale", "Organisation", "Logistique", "Timing", "Pertinence", "Clarte", "Interet", "Points_Positifs", "Ameliorations", "Recommandation", "NPS", "Contact_Souhaite"]);
  }
  
  sheet.appendRow([data.timestamp || new Date(), data.firstName, data.lastName, data.company, data.email, data.globalSatisfaction, data.orgQuality, data.logistics, data.timing, data.relevance, data.clarity, data.interest, data.positivePoints, data.improvements, data.recommendation, data.nps, data.optInContact ? "Oui" : "Non"]);
  return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = rows[i][j];
    }
    data.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0075B9] rounded-lg flex items-center justify-center font-bold">T</div>
            <h1 className="text-xl font-bold tracking-tight">Thalès Dashboard Admin</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchDashboardData} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-all">Actualiser</button>
            <button onClick={() => { setIsAdmin(false); sessionStorage.removeItem('thales_admin_auth'); }} className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-all">Déconnexion</button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
          {!googleSheetUrl ? (
            <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-2xl text-center">
              <h2 className="text-2xl font-bold mb-4 text-[#1CB3E7]">Configuration requise</h2>
              <p className="text-slate-400 mb-6">Veuillez d'abord configurer l'URL de votre Google Sheet dans les réglages du formulaire.</p>
              <button onClick={() => { setIsAdmin(false); setShowEmailModal(true); setModalTab('sheet'); }} className="px-6 py-3 bg-[#0075B9] text-white rounded-xl font-bold">Aller aux réglages</button>
            </div>
          ) : isLoadingData ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-[#1CB3E7] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-medium">Analyse des réponses en cours...</p>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Réponses totales" value={stats.total} icon="📊" color="#1CB3E7" />
                <StatCard title="Score NPS" value={stats.npsScore} subtitle={stats.npsScore > 0 ? "Excellent" : "À surveiller"} icon="🎯" color={stats.npsScore > 30 ? "#22c55e" : "#f59e0b"} />
                <StatCard title="Satisfaction Globale" value={`${stats.avg('Satisf_Globale').toFixed(1)}/5`} icon="⭐" color="#facc15" />
                <StatCard title="Taux de Recommandation" value={`${Math.round((stats.recos.Oui / stats.total) * 100)}%`} icon="🚀" color="#8b5cf6" />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ratings Breakdown */}
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
                  <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                    <span className="w-2 h-6 bg-[#1CB3E7] rounded-full"></span>
                    Moyennes par catégorie
                  </h3>
                  <div className="space-y-6">
                    <ProgressBar label="Organisation" value={stats.avg('Organisation')} max={5} color="#0075B9" />
                    <ProgressBar label="Logistique" value={stats.avg('Logistique')} max={5} color="#1CB3E7" />
                    <ProgressBar label="Timing" value={stats.avg('Timing')} max={5} color="#0ea5e9" />
                    <ProgressBar label="Pertinence" value={stats.avg('Pertinence')} max={5} color="#6366f1" />
                    <ProgressBar label="Clarté" value={stats.avg('Clarte')} max={5} color="#8b5cf6" />
                    <ProgressBar label="Intérêt" value={stats.avg('Interet')} max={5} color="#d946ef" />
                  </div>
                </div>

                {/* Recommendation Pie Simulation */}
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center justify-center">
                  <h3 className="text-lg font-bold mb-8 w-full text-left flex items-center gap-2">
                    <span className="w-2 h-6 bg-purple-500 rounded-full"></span>
                    Intention de recommandation
                  </h3>
                  <div className="flex items-center gap-12">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${(stats.recos.Oui / stats.total) * 100}, 100`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black">{Math.round((stats.recos.Oui / stats.total) * 100)}%</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Favorables</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <LegendItem color="#22c55e" label="Oui" count={stats.recos.Oui} />
                      <LegendItem color="#f59e0b" label="Peut-être" count={stats.recos.Maybe} />
                      <LegendItem color="#ef4444" label="Non" count={stats.recos.Non} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verbatim Section */}
              <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
                 <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                    Derniers Feedbacks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {sheetData.slice(-10).reverse().map((d, i) => (
                      <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-[#1CB3E7] uppercase tracking-tighter bg-[#1CB3E7]/10 px-2 py-1 rounded">{d.Prenom || 'Anonyme'}</span>
                          <span className="text-[10px] text-slate-500">{new Date(d.Date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm italic text-slate-300">"{d.Points_Positifs || 'Pas de commentaire'}"</p>
                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-red-400 uppercase">Amélioration :</span>
                          <span className="text-xs text-slate-400 truncate">{d.Ameliorations || '-'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 font-bold">Aucune donnée disponible pour le moment.</div>
          )}
        </main>
      </div>
    );
  }

  // --- Login Overlay ---
  if (showLogin) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#0075B9] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Espace Admin</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Accès restreint aux organisateurs</p>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Mot de passe" 
              className={`w-full px-6 py-4 bg-slate-100 border-2 rounded-2xl outline-none transition-all text-center font-bold tracking-widest ${loginError ? 'border-red-500 text-red-500 animate-shake' : 'border-transparent focus:border-[#0075B9] text-slate-800'}`}
            />
            {loginError && <p className="text-xs text-red-500 font-bold">Mot de passe incorrect</p>}
            <button type="submit" className="w-full py-4 bg-[#0075B9] text-white rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">S'authentifier</button>
            <button type="button" onClick={() => setShowLogin(false)} className="text-xs text-slate-400 font-bold hover:text-slate-600 transition-all uppercase tracking-widest">Retour au formulaire</button>
          </form>
        </div>
      </div>
    );
  }

  // --- Normal Form Views ---
  if (status === FormStatus.SUCCESS) {
    return (
      <div className="min-h-screen bg-[#0075B9] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full transform animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-10 h-10" /></div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Merci !</h2>
          <p className="text-slate-600 text-lg leading-relaxed">Vos réponses ont bien été enregistrées dans notre base de données.</p>
          <button onClick={() => window.location.reload()} className="mt-8 text-sm text-[#0075B9] font-bold hover:underline">Retourner au formulaire</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0075B9] flex flex-col">
      {/* Modal Configuration & Email (Existing) */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                <button onClick={() => setModalTab('email')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modalTab === 'email' ? 'bg-white text-[#0075B9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Email d'invitation</button>
                <button onClick={() => setModalTab('sheet')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modalTab === 'sheet' ? 'bg-white text-[#0075B9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Collecte Google Sheet</button>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50">
              {modalTab === 'email' ? (
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aperçu</span>
                    <div className="bg-white rounded-xl shadow-inner border border-slate-200 h-[450px] overflow-hidden"><iframe title="Email Preview" srcDoc={generateEmailHTML()} className="w-full h-full border-none" /></div>
                  </div>
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code HTML</span>
                    <textarea readOnly value={generateEmailHTML()} className="w-full h-[450px] p-4 font-mono text-xs bg-slate-900 text-slate-400 rounded-xl resize-none outline-none border-none leading-relaxed" />
                  </div>
                </div>
              ) : (
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-lg font-bold text-slate-800">1. URL de collecte</h4>
                    <input type="text" value={googleSheetUrl} onChange={(e) => setGoogleSheetUrl(e.target.value)} placeholder="https://script.google.com/macros/s/..." className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0075B9] outline-none transition-all font-mono text-sm" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-800">2. Code Apps Script (MAJ Dashboard)</h4>
                    <textarea readOnly value={appsScriptCode} rows={12} className="w-full p-4 font-mono text-xs bg-slate-900 text-[#1CB3E7] rounded-xl resize-none outline-none border-none leading-relaxed" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0075B9] flex items-center justify-center text-white font-bold text-xl shadow-inner">T</div>
            <span className="font-bold text-[#0075B9] text-lg tracking-tight">Thalès Informatique</span>
          </div>
          <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1CB3E7] text-white rounded-lg text-sm font-bold transition-all hover:bg-[#0075B9] shadow-md shadow-[#1CB3E7]/20">Configuration</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm">Votre avis compte</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">Partagez votre expérience de la Journée Portes Ouvertes.</p>
        </div>
      </section>

      {/* Main Form */}
      <main className="max-w-3xl mx-auto px-6 pb-24 flex-1">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Section title="A. Informations générales" subtitle="Saisie optionnelle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Ex: Jean" />
              <Input label="Nom" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Ex: Dupont" />
              <Input label="Entreprise" name="company" className="md:col-span-2" value={formData.company} onChange={handleInputChange} placeholder="Nom de votre organisation" />
            </div>
          </Section>

          <Section title="B. Satisfaction globale">
            <StarRating value={formData.globalSatisfaction} onChange={(v) => handleRating('globalSatisfaction', v)} />
          </Section>

          <Section title="C. Détails de l'expérience">
            <div className="space-y-6">
              <RatingRow label="Organisation générale" value={formData.orgQuality} onChange={(v) => handleRating('orgQuality', v)} />
              <RatingRow label="Accueil & logistique" value={formData.logistics} onChange={(v) => handleRating('logistics', v)} />
              <RatingRow label="Contenu des sujets" value={formData.relevance} onChange={(v) => handleRating('relevance', v)} />
            </div>
          </Section>

          <Section title="D. Votre Verbatim">
            <TextArea label="Qu’avez-vous le plus apprécié ?" name="positivePoints" value={formData.positivePoints} onChange={handleInputChange} placeholder="Dites-nous ce qui vous a marqué..." />
          </Section>

          <Section title="E. Recommandation & NPS">
             <div className="flex flex-wrap gap-4 mb-8">
              {['Oui', 'Non', 'Peut-être'].map((opt) => (
                <label key={opt} className={`flex-1 min-w-[100px] cursor-pointer border-2 rounded-xl py-4 px-4 text-center transition-all ${formData.recommendation === opt ? 'border-[#1CB3E7] bg-[#1CB3E7] text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                  <input type="radio" name="recommendation" value={opt} checked={formData.recommendation === opt} onChange={handleInputChange} className="sr-only" />
                  <span className="font-bold">{opt}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-700 font-medium">Score NPS (0-10)</p>
              <span className="text-2xl font-black text-[#1CB3E7]">{formData.nps}</span>
            </div>
            <input type="range" min="0" max="10" name="nps" value={formData.nps} onChange={handleInputChange} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1CB3E7]" />
          </Section>

          <div className="pt-10 flex flex-col items-center">
            <button type="submit" disabled={status === FormStatus.SUBMITTING} className={`w-full max-w-md py-5 rounded-2xl font-bold text-lg text-white shadow-2xl transition-all ${status === FormStatus.SUBMITTING ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1CB3E7] hover:bg-white hover:text-[#0075B9] shadow-blue-400/30'}`}>
              {status === FormStatus.SUBMITTING ? 'Envoi...' : 'Valider mon feedback'}
            </button>
          </div>
        </form>
      </main>

      <footer className="py-8 border-t border-white/10 bg-[#00609a] text-center">
        <p className="text-blue-200 text-sm font-medium mb-4">© 2025 Thalès Informatique</p>
        <button onClick={() => setShowLogin(true)} className="text-[10px] text-blue-300/50 hover:text-white uppercase tracking-[0.2em] font-bold transition-all">Accès Administrateur</button>
      </footer>
    </div>
  );
};

// --- Dashboard Components ---
const StatCard = ({ title, value, subtitle, icon, color }: any) => (
  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <span className="text-3xl">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="mt-2">
      <h4 className="text-3xl font-black" style={{ color }}>{value}</h4>
      {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const ProgressBar = ({ label, value, max, color }: any) => {
  const percentage = (value / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        <span className="text-white">{value.toFixed(1)} / {max}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label, count }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
    <span className="text-sm font-medium text-slate-300">{label}</span>
    <span className="text-xs font-bold text-slate-500">({count})</span>
  </div>
);

// --- Form Helper Components ---
const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-white/20 transition-all">
    <div className="border-l-4 border-[#1CB3E7] pl-4 mb-8">
      <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 font-medium">{subtitle}</p>}
    </div>
    <div>{children}</div>
  </div>
);

const Input: React.FC<{ label: string; name: string; value: string; onChange: any; placeholder?: string; type?: string; className?: string; required?: boolean; error?: string; id?: string; }> = ({ label, name, value, onChange, placeholder, type = 'text', className = '', required, error, id }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-sm font-bold text-slate-600 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    <input id={id} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none font-medium border-slate-100 bg-slate-50 focus:border-[#1CB3E7] focus:bg-white`} />
  </div>
);

const TextArea: React.FC<{ label: string; name: string; value: string; onChange: any; placeholder?: string; }> = ({ label, name, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-sm font-bold text-slate-600 ml-1">{label}</label>
    <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-[#1CB3E7] focus:bg-white transition-all outline-none resize-none font-medium" />
  </div>
);

const StarRating: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-6">
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all transform hover:scale-110 ${value >= star ? 'text-yellow-400 bg-yellow-50 shadow-inner' : 'text-slate-200 bg-slate-50'}`}>
          <Star filled={value >= star} className="w-8 h-8" />
        </button>
      ))}
    </div>
    <span className="font-bold text-[#1CB3E7] text-lg uppercase tracking-wider">
      {['Insuffisant', 'Passable', 'Moyen', 'Satisfait', 'Excellent'][value - 1] || 'Notez ici'}
    </span>
  </div>
);

const RatingRow: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-slate-100 transition-colors">
    <span className="text-slate-700 font-bold">{label}</span>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button key={num} type="button" onClick={() => onChange(num)} className={`w-12 h-12 rounded-xl font-black transition-all transform active:scale-90 ${value === num ? 'bg-[#1CB3E7] text-white shadow-lg' : 'bg-white text-slate-300 border border-slate-100'}`}>{num}</button>
      ))}
    </div>
  </div>
);

export default App;
