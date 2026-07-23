/**
 * Professional Footer Component for HMS
 * Includes brand identity, emergency contact box, quick navigation links,
 * medical departments, newsletter subscription form, accreditation badges, and copyright.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Heart,
  Send,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <footer className="relative bg-slate-900 text-slate-300 overflow-hidden font-sans border-t border-slate-800">
      {/* Subtle Background Lighting Accent */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── Top Trust & Accreditation Ribbon ─── */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <span className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> HIPAA Compliant Data Security
            </span>
            <span className="hidden sm:flex items-center gap-2 text-blue-400">
              <Award className="w-4 h-4" /> JCI Gold Seal Accredited
            </span>
            <span className="hidden md:flex items-center gap-2 text-purple-400">
              <Sparkles className="w-4 h-4" /> ISO 27001 Certified Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-slate-400">Emergency Desk 24/7:</span>
            <a
              href="tel:18004672273"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold hover:bg-red-500/30 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              1-800-HMS-CARE
            </a>
          </div>
        </div>
      </div>

      {/* ─── Main Footer Columns ─── */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        
        {/* Col 1 & 2: Brand Identity & Emergency Box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">HMS</span>
              <span className="text-xs block text-blue-400 font-semibold tracking-wider uppercase">Health Management System</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Delivering compassionate, world-class healthcare powered by cutting-edge medical technology. Seamlessly connecting doctors, nurses, pharmacists, and patients on a unified digital platform.
          </p>

          {/* Emergency Card Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/60 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                24/7 Emergency & Ambulance
              </span>
              <span className="text-xs text-slate-400">Response time &lt; 15 mins</span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <div>
                <p className="text-xs text-slate-400">Helpline Number</p>
                <p className="text-lg font-extrabold text-white tracking-wide">+1 (800) 467-2273</p>
              </div>
              <button
                onClick={() => navigate('/patient/book-appointment')}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-600/30 cursor-pointer"
              >
                Emergency Booking
              </button>
            </div>
          </div>

          {/* Location & Contact Info */}
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>742 Medical Center Blvd, Health City, HC 90210</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span>contact@hms-healthcare.com</span>
            </div>
          </div>
        </div>

        {/* Col 3: Quick Navigation Portals */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest border-l-2 border-blue-500 pl-2.5">
            Quick Portals
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <button
                onClick={() => navigate('/home')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Home Overview</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Patient Login</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/register')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Patient Registration</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Doctor & Staff Portal</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Symptom Suggestions</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-blue-400 transition flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Digital Pharmacy & Labs</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Medical Specialties */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest border-l-2 border-emerald-500 pl-2.5">
            Specialties
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="hover:text-emerald-400 transition cursor-pointer">Cardiology & Heart Care</li>
            <li className="hover:text-emerald-400 transition cursor-pointer">Neurology & Neurosurgery</li>
            <li className="hover:text-emerald-400 transition cursor-pointer">Pediatrics & Child Health</li>
            <li className="hover:text-emerald-400 transition cursor-pointer">Orthopedics & Joint Care</li>
            <li className="hover:text-emerald-400 transition cursor-pointer">Oncology & Cancer Care</li>
            <li className="hover:text-emerald-400 transition cursor-pointer">Emergency & Trauma Care</li>
          </ul>
        </div>

        {/* Col 5: Hours & Health Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest border-l-2 border-purple-500 pl-2.5">
            Hours & Updates
          </h4>
          
          <div className="space-y-2 text-xs text-slate-400 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-700/50">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Emergency:
              </span>
              <span className="font-semibold text-emerald-400">24/7 Open</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span>OPD Consultations:</span>
              <span className="text-slate-200">Mon - Sat (8am - 8pm)</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-xs text-slate-400">Subscribe for health tips & news:</p>
            {subscribed ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* ─── Bottom Copyright & Legal Ribbon ─── */}
      <div className="border-t border-slate-800/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} HMS Hospital Management System. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 transition cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 transition cursor-pointer">Security & Compliance</span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>for better patient care</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
