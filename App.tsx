
import React, { useState, useEffect } from 'react';
import { FormData, FormStatus } from './types';
import { Star, Check, Info } from './components/Icons';
import { generateEmailHTML } from './components/EmailTemplate';

const THALES_PRIMARY = '#0075B9';
const THALES_SECONDARY = '#1CB3E7';

const App: React.FC = () => {
  const [status, setStatus] = useState<FormStatus>(FormStatus.IDLE);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalTab, setModalTab] = useState<'email' | 'sheet'>('email');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  
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
      document.getElementById('email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setStatus(FormStatus.SUBMITTING);

    if (googleSheetUrl) {
      try {
        await fetch(googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            timestamp: new Date().toISOString()
          })
        });
        setStatus(FormStatus.SUCCESS);
      } catch (err) {
        console.error("Erreur d'envoi Sheet:", err);
        setErrors({ submit: "Erreur lors de l'envoi vers Google Sheet. Vérifiez l'URL de votre script." });
        setStatus(FormStatus.ERROR);
      }
    } else {
      setTimeout(() => setStatus(FormStatus.SUCCESS), 1500);
    }
  };

  const appsScriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  
  if (sheet.getLastRow() == 0) {
    sheet.appendRow([
      "Date", "Prénom", "Nom", "Entreprise", "Email", 
      "Satisf. Globale", "Organisation", "Logistique", 
      "Timing", "Pertinence", "Clarté", "Intérêt", 
      "Points Positifs", "Améliorations", "Recommandation", 
      "NPS", "Contact Souhaité"
    ]);
  }
  
  sheet.appendRow([
    data.timestamp || new Date(),
    data.firstName,
    data.lastName,
    data.company,
    data.email,
    data.globalSatisfaction,
    data.orgQuality,
    data.logistics,
    data.timing,
    data.relevance,
    data.clarity,
    data.interest,
    data.positivePoints,
    data.improvements,
    data.recommendation,
    data.nps,
    data.optInContact ? "Oui" : "Non"
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  if (status === FormStatus.SUCCESS) {
    return (
      <div className="min-h-screen bg-[#0075B9] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl max-w-lg w-full transform animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Merci !</h2>
          <p className="text-slate-600 text-lg leading-relaxed">Vos réponses ont bien été enregistrées dans notre base de données.</p>
          <button onClick={() => window.location.reload()} className="mt-8 text-sm text-[#0075B9] font-bold hover:underline">Retourner au formulaire</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0075B9]">
      {/* Modal Configuration & Email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                <button 
                  onClick={() => setModalTab('email')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modalTab === 'email' ? 'bg-white text-[#0075B9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Email d'invitation
                </button>
                <button 
                  onClick={() => setModalTab('sheet')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${modalTab === 'sheet' ? 'bg-white text-[#0075B9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Collecte Google Sheet
                </button>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50">
              {modalTab === 'email' ? (
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aperçu</span>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }} className={`text-xs font-bold px-3 py-1.5 rounded transition-all ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>{linkCopied ? 'Lien copié !' : 'Copier juste le lien'}</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-inner border border-slate-200 h-[450px] overflow-hidden"><iframe title="Email Preview" srcDoc={generateEmailHTML()} className="w-full h-full border-none" /></div>
                  </div>
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code HTML</span>
                    <div className="relative h-[450px]">
                      <textarea readOnly value={generateEmailHTML()} className="w-full h-full p-4 font-mono text-xs bg-slate-900 text-slate-400 rounded-xl resize-none outline-none border-none leading-relaxed" />
                      <button onClick={() => { navigator.clipboard.writeText(generateEmailHTML()); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`absolute bottom-4 right-4 px-8 py-3 rounded-xl font-bold shadow-xl transition-all transform active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-[#0075B9] text-white hover:bg-[#1CB3E7]'}`}>{copied ? '✓ HTML Copié' : 'Copier le code HTML'}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 max-w-4xl mx-auto space-y-10">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0075B9] text-white text-xs flex items-center justify-center">1</span>
                      Régler votre URL de collecte
                    </h4>
                    <p className="text-sm text-slate-500">Collez l'URL Apps Script ici pour activer la sauvegarde réelle.</p>
                    <input 
                      type="text" 
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/..." 
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-[#0075B9] outline-none transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0075B9] text-white text-xs flex items-center justify-center">2</span>
                      Code Apps Script
                    </h4>
                    <div className="relative">
                      <textarea readOnly value={appsScriptCode} rows={12} className="w-full p-4 font-mono text-xs bg-slate-900 text-[#1CB3E7] rounded-xl resize-none outline-none border-none leading-relaxed" />
                      <button onClick={() => { navigator.clipboard.writeText(appsScriptCode); setScriptCopied(true); setTimeout(() => setScriptCopied(false), 2000); }} className={`absolute bottom-4 right-4 px-6 py-2 rounded-lg font-bold shadow-lg transition-all ${scriptCopied ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>{scriptCopied ? 'Copié !' : 'Copier le script'}</button>
                    </div>
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
          <button 
            onClick={() => setShowEmailModal(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-[#1CB3E7] text-white rounded-lg text-sm font-bold transition-all hover:bg-[#0075B9] hover:shadow-xl shadow-md shadow-[#1CB3E7]/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Réglages & Email
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight drop-shadow-sm">Votre avis compte</h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Merci d’avoir participé à notre Journée Portes Ouvertes.<br className="hidden md:block"/> Votre retour nous aide à construire l'excellence.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm text-white/80 border border-white/20">
            <Info className="w-4 h-4" />
            <span>Temps estimé : 3 minutes</span>
          </div>
        </div>
      </section>

      {/* Main Form */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-8">
          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 text-white rounded-xl text-sm font-medium animate-pulse flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {errors.submit}
            </div>
          )}
          
          <Section title="A. Informations générales" subtitle="Saisie optionnelle">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Ex: Jean" />
              <Input label="Nom" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Ex: Dupont" />
              <Input label="Entreprise" name="company" className="md:col-span-2" value={formData.company} onChange={handleInputChange} placeholder="Nom de votre organisation" />
            </div>
          </Section>

          <Section title="B. Satisfaction globale">
            <p className="text-slate-700 mb-6 font-medium">Quel est votre niveau de satisfaction global ?</p>
            <StarRating value={formData.globalSatisfaction} onChange={(v) => handleRating('globalSatisfaction', v)} />
          </Section>

          <Section title="C. Déroulement de l’événement">
            <div className="space-y-6">
              <RatingRow label="Organisation générale" value={formData.orgQuality} onChange={(v) => handleRating('orgQuality', v)} />
              <RatingRow label="Accueil & logistique" value={formData.logistics} onChange={(v) => handleRating('logistics', v)} />
              <RatingRow label="Respect du programme" value={formData.timing} onChange={(v) => handleRating('timing', v)} />
            </div>
          </Section>

          <Section title="D. Contenu & interventions">
            <div className="space-y-6">
              <RatingRow label="Pertinence des sujets" value={formData.relevance} onChange={(v) => handleRating('relevance', v)} />
              <RatingRow label="Clarté des présentations" value={formData.clarity} onChange={(v) => handleRating('clarity', v)} />
              <RatingRow label="Intérêt des démonstrations" value={formData.interest} onChange={(v) => handleRating('interest', v)} />
            </div>
          </Section>

          <Section title="E. Expérience libre">
            <div className="space-y-8">
              <TextArea label="Qu’avez-vous le plus apprécié ?" name="positivePoints" value={formData.positivePoints} onChange={handleInputChange} placeholder="Dites-nous ce qui vous a marqué..." />
              <TextArea label="Points d'amélioration" name="improvements" value={formData.improvements} onChange={handleInputChange} placeholder="Vos suggestions de progrès..." />
            </div>
          </Section>

          <Section title="F. Recommandation (NPS)">
            <p className="text-slate-700 mb-6 font-medium">Recommanderiez-vous les événements Thalès ?</p>
            <div className="flex flex-wrap gap-4">
              {['Oui', 'Non', 'Peut-être'].map((opt) => (
                <label key={opt} className={`flex-1 min-w-[100px] cursor-pointer border-2 rounded-xl py-4 px-4 text-center transition-all ${formData.recommendation === opt ? 'border-[#1CB3E7] bg-[#1CB3E7] text-white shadow-lg' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                  <input type="radio" name="recommendation" value={opt} checked={formData.recommendation === opt} onChange={handleInputChange} className="sr-only" />
                  <span className="font-bold">{opt}</span>
                </label>
              ))}
            </div>
            <div className="mt-12">
              <div className="flex justify-between items-center mb-4">
                <p className="text-slate-700 font-medium">Note de recommandation (0-10)</p>
                <span className="text-2xl font-black text-[#1CB3E7]">{formData.nps}</span>
              </div>
              <input type="range" min="0" max="10" name="nps" value={formData.nps} onChange={handleInputChange} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1CB3E7]" />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                <span>Détracteur</span>
                <span>Promoteur</span>
              </div>
            </div>
          </Section>

          <Section title="G. Engagement futur">
            <div className="space-y-6">
              <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="relative flex items-center mt-1">
                  <input type="checkbox" name="optInContact" checked={formData.optInContact} onChange={handleInputChange} className="peer w-6 h-6 border-2 border-slate-200 rounded-md focus:ring-0 checked:bg-[#1CB3E7] checked:border-[#1CB3E7] appearance-none cursor-pointer transition-all" />
                  <Check className="absolute w-4 h-4 text-white left-1 pointer-events-none hidden peer-checked:block" />
                </div>
                <span className="text-slate-700 font-medium select-none leading-relaxed">Je souhaite être recontacté par l'équipe Thalès pour approfondir nos échanges.</span>
              </label>
              {(formData.optInContact || formData.email) && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <Input id="email" label="Votre email professionnel" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="jean.dupont@entreprise.com" required={formData.optInContact} error={errors.email} />
                </div>
              )}
            </div>
          </Section>

          <div className="pt-10 flex flex-col items-center">
            <button 
              type="submit" 
              disabled={status === FormStatus.SUBMITTING} 
              className={`w-full max-w-md py-5 rounded-2xl font-bold text-lg text-white shadow-2xl transition-all transform active:scale-95 ${status === FormStatus.SUBMITTING ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1CB3E7] hover:bg-[#0075B9] hover:shadow-blue-400/30'}`}
            >
              {status === FormStatus.SUBMITTING ? 'Finalisation...' : 'Valider mon feedback'}
            </button>
            <p className="mt-6 text-xs text-blue-200 font-medium tracking-wide">CONFIDENTIALITÉ GARANTIE • THALÈS INFORMATIQUE</p>
          </div>
        </form>
      </main>

      <footer className="py-12 border-t border-white/10 bg-[#00609a]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-blue-200 text-sm font-medium">© {new Date().getFullYear()} Thalès Informatique. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

// Helper Components avec styles rafraîchis
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
    <input id={id} type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none font-medium ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-100 bg-slate-50 focus:border-[#1CB3E7] focus:bg-white'}`} />
    {error && <p className="text-xs text-red-500 ml-1 font-bold">{error}</p>}
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
        <button key={num} type="button" onClick={() => onChange(num)} className={`w-12 h-12 rounded-xl font-black transition-all transform active:scale-90 ${value === num ? 'bg-[#1CB3E7] text-white shadow-lg' : 'bg-white text-slate-300 hover:text-slate-500 border border-slate-100'}`}>{num}</button>
      ))}
    </div>
  </div>
);

export default App;
