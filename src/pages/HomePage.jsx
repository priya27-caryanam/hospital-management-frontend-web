/**
 * HomePage — Public landing page for Hospital Management System (HMS)
 * Includes announcement top bar, modern header, hero showcase, quick action tiles,
 * department grid, interactive symptom checker preview, facility showcase,
 * patient testimonials, FAQ accordion, and professional footer.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  CalendarCheck,
  Stethoscope,
  FileText,
  HeadsetIcon,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Clock,
  Award,
  Users,
  CheckCircle2,
  ChevronDown,
  Star,
  Sparkles,
  Search,
  Pill,
  Microscope,
  Brain,
  Baby,
  Bone,
  Heart,
  UserCheck,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';
import Footer from '../components/layout/Footer';
import LanguageSelector from '../components/common/LanguageSelector';

/** Medical Departments Data */
const DEPARTMENTS = [
  {
    id: 'cardiology',
    name: 'Cardiology',
    icon: Heart,
    color: 'from-rose-500 to-red-600',
    badgeBg: 'bg-rose-50 text-rose-600 border-rose-200',
    doctorsCount: 14,
    description: 'Advanced cardiac care, ECG, angiography, and open heart surgeries.',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    badgeBg: 'bg-purple-50 text-purple-600 border-purple-200',
    doctorsCount: 10,
    description: 'Expert care for brain, spine, stroke, and neuromuscular conditions.',
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    icon: Baby,
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
    doctorsCount: 12,
    description: 'Comprehensive infant, child, and adolescent healthcare and vaccinations.',
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    icon: Bone,
    color: 'from-blue-500 to-cyan-600',
    badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
    doctorsCount: 15,
    description: 'Bone, joint replacements, sports injuries, and spine reconstruction.',
  },
  {
    id: 'pharmacy',
    name: 'Digital Pharmacy',
    icon: Pill,
    color: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    doctorsCount: 8,
    description: '24/7 digital prescriptions, automated dispensing, and home delivery.',
  },
  {
    id: 'diagnostics',
    name: 'Diagnostics & Lab',
    icon: Microscope,
    color: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    doctorsCount: 11,
    description: 'High-precision blood testing, MRI, CT Scan, and digital pathology.',
  },
];

/** Features Data */
const FEATURES = [
  {
    icon: CalendarCheck,
    title: 'Instant Online Booking',
    description: 'Schedule appointments with specialized doctors in seconds with zero waiting queue.',
    color: 'text-blue-600 bg-blue-100/80',
  },
  {
    icon: Stethoscope,
    title: 'Top Board Specialists',
    description: 'Connect with verified physicians across 20+ specialized medical faculties.',
    color: 'text-emerald-600 bg-emerald-100/80',
  },
  {
    icon: FileText,
    title: 'Digital Health Records',
    description: 'Secure paperless access to lab reports, prescriptions, and medical history 24/7.',
    color: 'text-purple-600 bg-purple-100/80',
  },
  {
    icon: HeadsetIcon,
    title: '24/7 Emergency Support',
    description: 'Dedicated trauma team and immediate ambulance dispatch around the clock.',
    color: 'text-rose-600 bg-rose-100/80',
  },
];

/** Patient Testimonials */
const TESTIMONIALS = [
  {
    quote: 'HMS made scheduling my cardiac checkup effortless. The digital prescription and instant lab results saved me hours of waiting.',
    name: 'Robert Vance',
    role: 'Patient since 2023',
    rating: 5,
    avatarBg: 'bg-blue-600',
  },
  {
    quote: 'As a mother, having 24/7 access to pediatric doctors and online appointment booking gives me total peace of mind.',
    name: 'Elena Rostova',
    role: 'Mother of two',
    rating: 5,
    avatarBg: 'bg-emerald-600',
  },
  {
    quote: 'The doctor portal is extremely smooth. Viewing patient histories and issuing prescriptions takes just a few clicks.',
    name: 'Dr. Michael Chang',
    role: 'Chief Neurologist',
    rating: 5,
    avatarBg: 'bg-purple-600',
  },
];

/** FAQ Accordion Data */
const FAQS = [
  {
    q: 'How do I book an appointment with a specialist?',
    a: 'You can book an appointment directly through our patient portal after creating a free account. Simply search for your preferred department or doctor, select an available date and time slot, and confirm instantly.',
  },
  {
    q: 'Can I view my medical prescriptions and lab reports online?',
    a: 'Yes! All consultation summaries, e-prescriptions, and laboratory test reports are securely stored in your personal digital medical records inside your Patient Dashboard.',
  },
  {
    q: 'What should I do in case of a medical emergency?',
    a: 'For urgent medical emergencies, call our dedicated 24/7 hotline at 1-800-HMS-CARE immediately or visit our Emergency & Trauma Unit at 742 Medical Center Blvd.',
  },
  {
    q: 'Is my personal health data kept safe and confidential?',
    a: 'Absolutely. HMS is built with bank-grade encryption and full HIPAA compliance standards to ensure your medical privacy is completely protected.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* ─── 1. Top Emergency Announcement Ribbon ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
              <PhoneCall className="w-3 h-3" /> 24/7 Hotline
            </span>
            <span className="text-slate-300 font-medium hidden sm:inline">
              Emergency Trauma & Ambulance Services:
            </span>
            <a href="tel:18004672273" className="font-bold text-red-400 hover:text-red-300 transition">
              1-800-HMS-CARE (+1 800-467-2273)
            </a>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Real-time Doctor Availability Active
            </span>
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-blue-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span>Staff Login</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Sticky Glassmorphism Header ─── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/home')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                HMS<span className="text-blue-600">.</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-500 tracking-widest uppercase -mt-1">
                Healthcare System
              </span>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition">Home</a>
            <a href="#specialties" className="hover:text-blue-600 transition">Specialties</a>
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#reviews" className="hover:text-blue-600 transition">Reviews</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-100 hover:text-blue-600 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── 3. Hero Section ─── */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white pt-16 pb-32">
        {/* Background Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span>Next-Gen Smart Healthcare Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Precision Care. <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Modern Technology.
              </span> <br />
              Compassionate Healing.
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Experience modern healthcare administration with real-time specialist appointments, digital prescriptions, paperless diagnostic reports, and 24/7 medical support.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-900 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Book Appointment Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-slate-800/90 border border-slate-700 rounded-2xl hover:bg-slate-700 hover:border-slate-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Stethoscope className="w-5 h-5 text-blue-400" />
                <span>Patient & Staff Login</span>
              </button>
            </div>

            {/* Live Stats Pill Row */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-2xl lg:text-3xl font-extrabold text-white">50,000+</p>
                <p className="text-xs text-slate-400 font-medium">Patients Treated</p>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-extrabold text-cyan-400">150+</p>
                <p className="text-xs text-slate-400 font-medium">Board Doctors</p>
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-extrabold text-emerald-400">99.8%</p>
                <p className="text-xs text-slate-400 font-medium">Care Rating</p>
              </div>
            </div>
          </div>

          {/* Right Floating Card Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 bg-gradient-to-b from-slate-800/60 to-slate-900/90 backdrop-blur-xl shadow-2xl p-4">
              
              {/* High-res Hero Image */}
              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden">
                <img
                  src="/images/hero_doctor.jpg"
                  alt="HMS Top Doctor"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Floating Status Pill Top Left */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-white shadow-lg">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Dr. Sarah Jenkins (Cardiology)</span>
                </div>

                {/* Floating Badge Bottom Left */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-white">
                  <div>
                    <p className="font-bold text-sm">Consultation Desk</p>
                    <p className="text-slate-400">Avg response time &lt; 10 mins</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9 / 5.0</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─── 4. Quick Action Floating Strip (Overlapping Hero) ─── */}
      <section className="relative max-w-7xl mx-auto px-6 -mt-20 z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div
            onClick={() => navigate('/patient/book-appointment')}
            className="group bg-white rounded-2xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Book Appointment</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Choose specialty, doctor, & schedule slot online instantly.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600">
              <span>Book Online</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/login')}
            className="group bg-white rounded-2xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-red-600 transition-colors">24/7 Emergency Care</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Immediate trauma care and priority ambulance dispatch.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-red-600">
              <span>Call Helpline</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/login')}
            className="group bg-white rounded-2xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Specialist Directory</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Find right department and expert doctor recommendations.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-600">
              <span>View Specialists</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/login')}
            className="group bg-white rounded-2xl p-6 shadow-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Digital Prescriptions</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Paperless lab tests, e-prescriptions, & bill view.</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span>Access Records</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* ─── 5. Key Specialties Showcase ─── */}
      <section id="specialties" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Medical Departments
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Specialized Care Centers
          </h2>
          <p className="text-slate-500 text-base">
            Our medical center houses state-of-the-art specialized faculties led by board-certified physicians.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="group bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${dept.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${dept.badgeBg}`}>
                      {dept.doctorsCount} Specialists
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    {dept.description}
                  </p>
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Book Specialist</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 6. Why HMS Platform Features ─── */}
      <section id="features" className="bg-slate-100/70 border-y border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Why HMS System
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for Complete Hospital Operations
            </h2>
            <p className="text-slate-500 text-base">
              A single unified ecosystem connecting patients, doctors, nurses, receptionists, pharmacists, and lab technicians.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 hover:shadow-lg transition-all"
              >
                <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center mb-6`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Facility Showcase Section ─── */}
      <section className="bg-white border-t border-slate-200 py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <img
              src="/images/facility.jpg"
              alt="HMS Medical Center Facility"
              className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl text-white text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">State-of-the-Art Medical Infrastructure</p>
                <p className="text-slate-300">Advanced ICUs, modular operation theaters & diagnostics</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              World Class Infrastructure
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hospital Excellence & Patient Safety First
            </h2>

            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Equipped with latest generation diagnostic machinery, zero-infection surgical suites, and specialized intensive care units managed by trained nurses and physicians 24 hours a day.
            </p>

            <div className="space-y-3 pt-2 text-sm text-slate-700 font-medium">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Fully digital paperless workflow with instant prescription retrieval</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>24/7 in-house pharmacy and emergency laboratory testing</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Strict infection control and international hygiene compliance</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                <span>Register to Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ─── 9. Patient Testimonials & Reviews ─── */}
      <section id="reviews" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Patient Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Trusted by Thousands of Patients
          </h2>
          <p className="text-slate-500 text-base">
            Read authentic feedback from patients and healthcare professionals using our platform.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-6">
                <div className={`h-10 w-10 rounded-full ${t.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 10. FAQ Accordion ─── */}
      <section id="faq" className="bg-slate-100/70 border-t border-slate-200 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <span className="text-base">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 11. Ultra Professional Footer Component ─── */}
      <Footer />

    </div>
  );
}
