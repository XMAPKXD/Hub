import React, { useState, useEffect, useMemo } from 'react';
import { CommunityEvent, EventParticipant, EventStatus } from '../types';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Copy, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Search, 
  UploadCloud, 
  ShieldCheck, 
  Play, 
  X, 
  Check, 
  Sparkles, 
  Filter, 
  Tag, 
  UserCheck, 
  FileCheck,
  Edit3,
  ExternalLink,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';

interface EventsSectionProps {
  isAdmin: boolean;
  currentUser?: any;
  soundEnabled?: boolean;
  triggerAudio?: (type: 'tap' | 'levelUp' | 'success') => void;
  onAddXP?: (amount: number, reason: string) => void;
}

const CATEGORIES = [
  "Todas",
  "Torneios",
  "Festas",
  "Esconder-Esconder",
  "Encontros de Creators",
  "Desafios & Mini-Games",
  "Outros"
];

const DEFAULT_COMMUNITY_EVENTS: CommunityEvent[] = [];

export default function EventsSection({
  isAdmin,
  currentUser,
  soundEnabled,
  triggerAudio,
  onAddXP
}: EventsSectionProps) {
  const [events, setEvents] = useState<CommunityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_custom_events');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(ev => 
            ev.id !== 'event_crazy_run_mega' && 
            ev.id !== 'event_festa_desfile' &&
            !ev.name?.includes('Mega Torneio') &&
            !ev.name?.includes('Grande Desfile')
          );
          try {
            localStorage.setItem('pkxd_custom_events', JSON.stringify(cleaned));
          } catch (e) {}
          return cleaned;
        }
      }
    } catch (e) {}
    return DEFAULT_COMMUNITY_EVENTS;
  });
  const [participants, setParticipants] = useState<EventParticipant[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_event_participants');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(p => 
            p.eventId !== 'event_crazy_run_mega' && 
            p.eventId !== 'event_festa_desfile'
          );
          try {
            localStorage.setItem('pkxd_event_participants', JSON.stringify(cleaned));
          } catch (e) {}
          return cleaned;
        }
      }
    } catch (e) {}
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPresenceModal, setShowPresenceModal] = useState<CommunityEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<CommunityEvent | null>(null);
  const [showOrganizerPanel, setShowOrganizerPanel] = useState<CommunityEvent | null>(null);

  // Form states for Create Event
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Torneios');
  const [customCategory, setCustomCategory] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventBanner, setNewEventBanner] = useState('');
  const [newOrganizerName, setNewOrganizerName] = useState(currentUser?.displayName || '');
  const [newEventRules, setNewEventRules] = useState('');
  const [newMaxParticipants, setNewMaxParticipants] = useState<string>('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState(false);

  // Presence Confirmation state
  const [playerTagInput, setPlayerTagInput] = useState('');
  const [hasAutoFilledTag, setHasAutoFilledTag] = useState(false);
  const [presenceError, setPresenceError] = useState('');
  const [presenceSuccess, setPresenceSuccess] = useState(false);

  // Organizer Panel Search & Toast states
  const [participantSearch, setParticipantSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedSingleTagId, setCopiedSingleTagId] = useState<string | null>(null);
  const [copiedBatchFormat, setCopiedBatchFormat] = useState<string | null>(null);
  const [copyFormatTab, setCopyFormatTab] = useState<'lines' | 'comma' | 'numbered'>('lines');
  const [quickAddTagInput, setQuickAddTagInput] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleShareEvent = (event: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const shareUrl = `${window.location.origin}${window.location.pathname}?evento=${event.id}#events-section-wrapper`;
    if (navigator.share) {
      navigator.share({
        title: `Evento PK XD: ${event.name}`,
        text: `🎉 Venha participar do evento "${event.name}" no PK XD Central!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast(`🔗 Link do evento "${event.name}" copiado!`);
    }
  };

  // Subscribe to events & participants from Firestore
  useEffect(() => {
    if (!db) return;

    // Listen to community_events
    const eventsRef = collection(db, 'community_events');
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const list: CommunityEvent[] = [];
      snapshot.forEach((docSnap) => {
        const evData = { id: docSnap.id, ...docSnap.data() } as CommunityEvent;
        if (
          docSnap.id === 'event_crazy_run_mega' ||
          docSnap.id === 'event_festa_desfile' ||
          evData.name?.includes('Mega Torneio') ||
          evData.name?.includes('Grande Desfile')
        ) {
          deleteDoc(doc(db, 'community_events', docSnap.id)).catch(() => {});
        } else {
          list.push(evData);
        }
      });
      // Sort by creation date descending
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEvents(list);
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(list));
      } catch (e) {}
    }, (error) => {
      console.warn("Firestore events sync warning (using local):", error);
    });

    // Listen to event_participants
    const partRef = collection(db, 'event_participants');
    const unsubPart = onSnapshot(partRef, (snapshot) => {
      const list: EventParticipant[] = [];
      snapshot.forEach((docSnap) => {
        const pData = { id: docSnap.id, ...docSnap.data() } as EventParticipant;
        if (
          pData.eventId === 'event_crazy_run_mega' ||
          pData.eventId === 'event_festa_desfile'
        ) {
          deleteDoc(doc(db, 'event_participants', docSnap.id)).catch(() => {});
        } else {
          list.push(pData);
        }
      });
      setParticipants(list);
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(list));
      } catch (e) {}
    }, (error) => {
      console.warn("Firestore participants sync warning:", error);
    });

    return () => {
      unsubEvents();
      unsubPart();
    };
  }, []);

  // Filter events based on active category & status tab
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      // Category filter
      if (selectedCategory !== "Todas" && ev.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === "EM_ANALISE") {
        return ev.status === 'Em análise';
      }
      if (statusFilter === "APROVADOS") {
        return ev.status === 'Aprovado' || ev.status === 'Em breve' || ev.status === 'Ao vivo';
      }
      if (statusFilter === "AO_VIVO") {
        return ev.status === 'Ao vivo';
      }
      if (statusFilter === "ENCERRADOS") {
        return ev.status === 'Encerrado';
      }

      return true;
    });
  }, [events, selectedCategory, statusFilter]);

  // Count pending events for Admin alert
  const pendingEventsCount = useMemo(() => {
    return events.filter(e => e.status === 'Em análise').length;
  }, [events]);

  // Handle banner upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem é muito grande! Escolha uma imagem de até 8MB.');
      return;
    }

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewEventBanner(event.target?.result as string);
      setIsUploadingBanner(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar arquivo de imagem.');
      setIsUploadingBanner(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle Create Event submit
  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerAudio) triggerAudio('tap');

    if (!newEventName.trim() || !newEventDate || !newOrganizerName.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Data e Organizador).');
      return;
    }

    const cat = newEventCategory === 'CUSTOM' ? customCategory || 'Outros' : newEventCategory;
    const maxPart = newMaxParticipants ? parseInt(newMaxParticipants, 10) : undefined;

    const eventId = 'event_' + Date.now();
    const newEvent: CommunityEvent = {
      id: eventId,
      name: newEventName.trim(),
      description: newEventDesc.trim() || 'Evento oficial da comunidade PK XD!',
      category: cat,
      date: newEventDate,
      time: newEventTime || '18:00',
      bannerUrl: newEventBanner.trim() || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      organizerName: newOrganizerName.trim(),
      rules: newEventRules.trim() || 'Respeitar os demais jogadores e seguir as instruções do organizador.',
      maxParticipants: maxPart,
      status: 'Aprovado',
      createdAt: Date.now(),
      approvedAt: Date.now(),
      createdById: currentUser?.uid || 'user_' + Date.now()
    };

    // Clean undefined fields for Firestore compatibility
    const cleanedData: Record<string, any> = {};
    Object.entries(newEvent).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanedData[key] = val;
      }
    });

    // Update local state immediately so user sees their event right away!
    setEvents(prev => {
      const updated = [newEvent, ...prev.filter(e => e.id !== eventId)];
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      if (db) {
        await setDoc(doc(db, 'community_events', eventId), cleanedData);
      }
    } catch (err: any) {
      console.warn("Could not sync event to remote Firestore, saved locally:", err);
    }

    if (triggerAudio) triggerAudio('success');
    if (onAddXP) onAddXP(50, 'Criou um evento da comunidade (+50 XP)');

    setCreateSuccessMsg(true);
    setTimeout(() => {
      setCreateSuccessMsg(false);
      setShowCreateModal(false);
      // Reset form
      setNewEventName('');
      setNewEventDesc('');
      setNewEventBanner('');
      setNewEventRules('');
      setNewMaxParticipants('');
      setNewEventDate('');
      setNewEventTime('');
      showToast('🎉 Evento criado e publicado com sucesso!');
    }, 1200);
  };

  // Handle Status Change (Admin)
  const handleUpdateStatus = async (eventId: string, newStatus: EventStatus) => {
    if (triggerAudio) triggerAudio('tap');
    try {
      if (db) {
        await updateDoc(doc(db, 'community_events', eventId), {
          status: newStatus,
          approvedAt: newStatus === 'Aprovado' ? Date.now() : undefined
        });
      } else {
        setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: newStatus } : ev));
      }
      showToast(`Status do evento atualizado para "${newStatus}"!`);
    } catch (err) {
      console.error("Error updating event status:", err);
    }
  };

  // Open Presence Modal helper with auto-filled tag
  const handleOpenPresenceModal = (event: CommunityEvent) => {
    if (triggerAudio) triggerAudio('tap');
    const rawTag = localStorage.getItem('pkxd_player_tag') || '';
    const clean = rawTag.trim().toUpperCase();
    const isConfiguredTag = clean && clean.includes('#') && !clean.includes('JOGADOR#000') && !clean.includes('GUEST') && clean.split('#')[0].length >= 2 && clean.split('#')[1].length >= 1;

    if (isConfiguredTag) {
      setPlayerTagInput(clean);
      setHasAutoFilledTag(true);
    } else {
      setPlayerTagInput('');
      setHasAutoFilledTag(false);
    }
    setPresenceError('');
    setPresenceSuccess(false);
    setShowPresenceModal(event);
  };

  // Handle Event Delete (Admin/Organizer)
  const handleDeleteEvent = async (eventId: string) => {
    if (triggerAudio) triggerAudio('tap');
    setShowDetailsModal(null);
    setShowPresenceModal(null);
    setShowOrganizerPanel(null);

    // 1. Update local state immediately
    setEvents(prev => {
      const updated = prev.filter(ev => ev.id !== eventId);
      try {
        localStorage.setItem('pkxd_custom_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setParticipants(prev => {
      const updated = prev.filter(p => p.eventId !== eventId);
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Also remove this event from user's passport event history if present
    try {
      const savedPassport = localStorage.getItem('pkxd_passport_data');
      if (savedPassport) {
        const pData = JSON.parse(savedPassport);
        if (Array.isArray(pData.eventHistory)) {
          const evToDelete = events.find(e => e.id === eventId);
          pData.eventHistory = pData.eventHistory.filter((h: any) => 
            h.id !== eventId && 
            h.eventName !== evToDelete?.name &&
            h.id !== 'ev_1' && h.id !== 'ev_2' &&
            !h.eventName?.includes('Mega Torneio') &&
            !h.eventName?.includes('Grande Desfile')
          );
          localStorage.setItem('pkxd_passport_data', JSON.stringify(pData));
          if (db && currentUser?.uid && currentUser.uid !== 'guest_user') {
            setDoc(doc(db, 'pkxd_passports', currentUser.uid), pData, { merge: true }).catch(() => {});
          }
        }
      }
    } catch (e) {}

    // 3. Delete from Firestore if exists
    try {
      if (db) {
        deleteDoc(doc(db, 'community_events', eventId)).catch(() => {});
        const eventParts = participants.filter(p => p.eventId === eventId);
        for (const p of eventParts) {
          try {
            deleteDoc(doc(db, 'event_participants', p.id)).catch(() => {});
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Could not delete from remote Firestore (deleted locally):", err);
    }
    showToast('🗑️ Evento excluído com sucesso!');
  };

  // Handle Presence Confirmation submit
  const handleConfirmPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPresenceModal) return;

    if (triggerAudio) triggerAudio('tap');
    setPresenceError('');

    let rawTag = playerTagInput.trim().toUpperCase();
    if (!rawTag) {
      setPresenceError('Por favor, informe seu identificador do PK XD (ex: KOOSH#000).');
      return;
    }

    // Auto-format if user forgot '#'
    if (!rawTag.includes('#')) {
      rawTag = rawTag + '#000';
    }

    const eventId = showPresenceModal.id;
    const currentList = participants.filter(p => p.eventId === eventId);

    // Check duplicate
    if (currentList.some(p => p.playerIdentifier === rawTag)) {
      setPresenceError(`O jogador "${rawTag}" já está confirmado neste evento!`);
      return;
    }

    // Check max participants limit
    if (showPresenceModal.maxParticipants && currentList.length >= showPresenceModal.maxParticipants) {
      setPresenceError('Desculpe, o limite máximo de participantes para este evento já foi atingido!');
      return;
    }

    const newPart: EventParticipant = {
      id: `part_${eventId}_${Date.now()}`,
      eventId,
      playerIdentifier: rawTag,
      registeredAt: Date.now()
    };

    // 1. Update local state and localStorage immediately (guaranteed success)
    setParticipants(prev => {
      const updated = [...prev, newPart];
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Automatically record in user's Passport Event History (+30 XP)
    try {
      const savedPassport = localStorage.getItem('pkxd_passport_data');
      if (savedPassport) {
        const pData = JSON.parse(savedPassport);
        const newHistEntry = {
          id: 'ev_' + Date.now(),
          eventName: showPresenceModal.name,
          role: 'participante',
          date: showPresenceModal.date,
          category: showPresenceModal.category
        };
        const currentHist = Array.isArray(pData.eventHistory) 
          ? pData.eventHistory.filter((h: any) => 
              h.id !== 'ev_1' && h.id !== 'ev_2' &&
              !h.eventName?.includes('Mega Torneio') &&
              !h.eventName?.includes('Grande Desfile')
            ) 
          : [];
        if (!currentHist.some((h: any) => h.eventName === showPresenceModal.name)) {
          pData.eventHistory = [newHistEntry, ...currentHist];
          pData.updatedAt = Date.now();
          localStorage.setItem('pkxd_passport_data', JSON.stringify(pData));
          if (db && currentUser?.uid && currentUser.uid !== 'guest_user') {
            setDoc(doc(db, 'pkxd_passports', currentUser.uid), pData, { merge: true }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("Could not sync to passport:", e);
    }

    // 3. Attempt async Firestore persistence in background
    if (db) {
      setDoc(doc(db, 'event_participants', newPart.id), newPart).catch((err) => {
        console.warn("Participant sync to Firestore background warning (saved locally):", err);
      });
    }

    if (triggerAudio) triggerAudio('levelUp');
    if (onAddXP) onAddXP(30, 'Confirmou presença em evento (+30 XP)');

    setPresenceSuccess(true);
    setTimeout(() => {
      setPresenceSuccess(false);
      setShowPresenceModal(null);
      setPlayerTagInput('');
      showToast(`✓ Presença confirmada para "${rawTag}"! (+30 XP)`);
    }, 1200);
  };

  // Handle Remove Participant
  const handleRemoveParticipant = async (partId: string, playerIdentifier: string) => {
    if (!window.confirm(`Deseja remover "${playerIdentifier}" da lista de participantes?`)) return;
    if (triggerAudio) triggerAudio('tap');

    try {
      if (db) {
        await deleteDoc(doc(db, 'event_participants', partId));
      } else {
        setParticipants(prev => prev.filter(p => p.id !== partId));
      }
      showToast(`Participante "${playerIdentifier}" removido.`);
    } catch (err) {
      console.error("Error removing participant:", err);
    }
  };

  // Helper to copy a single player's tag
  const handleCopySingleTag = (tag: string, partId: string) => {
    if (triggerAudio) triggerAudio('tap');
    navigator.clipboard.writeText(tag);
    setCopiedSingleTagId(partId);
    setTimeout(() => setCopiedSingleTagId(null), 2500);
    showToast(`✓ Tag "${tag}" copiada! Cole no jogo para convidar.`);
  };

  // Helper to copy list with custom formats (lines, comma-separated, or numbered)
  const handleCopyTagsFormatted = (event: CommunityEvent, list: EventParticipant[], format: 'lines' | 'comma' | 'numbered') => {
    if (triggerAudio) triggerAudio('tap');
    if (list.length === 0) {
      showToast('Nenhum participante confirmado para copiar.');
      return;
    }

    let formattedText = '';
    if (format === 'lines') {
      formattedText = list.map(p => p.playerIdentifier).join('\n');
    } else if (format === 'comma') {
      formattedText = list.map(p => p.playerIdentifier).join(', ');
    } else if (format === 'numbered') {
      formattedText = `[Lista de Membros - ${event.name}]\n` + list.map((p, i) => `${i + 1}. ${p.playerIdentifier}`).join('\n');
    }

    navigator.clipboard.writeText(formattedText);
    setCopiedBatchFormat(format);
    setTimeout(() => setCopiedBatchFormat(null), 2500);
    showToast(`✓ ${list.length} tag(s) copiadas (${format === 'comma' ? 'com vírgula' : format === 'numbered' ? 'numeradas' : '1 por linha'})!`);
  };

  // Helper to copy list formatted as plain line-by-line list
  const handleCopyList = (event: CommunityEvent, list: EventParticipant[]) => {
    handleCopyTagsFormatted(event, list, 'lines');
  };

  // Helper for Organizer to manually add a participant tag
  const handleQuickAddParticipant = async (eventId: string) => {
    if (!quickAddTagInput.trim()) return;
    const rawTag = quickAddTagInput.trim().toUpperCase();
    if (!rawTag.includes('#')) {
      alert('Por favor insira a tag no formato NOME#000');
      return;
    }

    // Check duplicate
    const eventParts = participants.filter(p => p.eventId === eventId);
    if (eventParts.some(p => p.playerIdentifier.toUpperCase() === rawTag)) {
      alert('Este jogador já está na lista deste evento!');
      return;
    }

    const newPart: EventParticipant = {
      id: 'part_' + Date.now(),
      eventId,
      playerIdentifier: rawTag,
      registeredAt: Date.now()
    };

    setParticipants(prev => {
      const updated = [...prev, newPart];
      try {
        localStorage.setItem('pkxd_event_participants', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (db) {
      setDoc(doc(db, 'event_participants', newPart.id), newPart).catch(() => {});
    }

    setQuickAddTagInput('');
    setShowQuickAdd(false);
    if (triggerAudio) triggerAudio('success');
    showToast(`✓ Jogador "${rawTag}" adicionado à lista do evento!`);
  };

  // Helper to export list as TXT
  const handleExportTXT = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');

    const formattedText = list.map(p => p.playerIdentifier).join('\n');
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participantes_${event.name.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo .TXT baixado!');
  };

  // Helper to export list as Excel (.xlsx)
  const handleExportExcel = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');

    const excelData = list.map((p, index) => ({
      '#': index + 1,
      'Identificador PKXD': p.playerIdentifier,
      'Data de Inscrição': new Date(p.registeredAt).toLocaleString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participantes');

    XLSX.writeFile(workbook, `participantes_${event.name.replace(/\s+/g, '_')}.xlsx`);
    showToast('Planilha Excel (.XLSX) baixada com sucesso!');
  };

  // Helper to export list as PDF
  const handleExportPDF = (event: CommunityEvent, list: EventParticipant[]) => {
    if (triggerAudio) triggerAudio('tap');

    const doc = new jsPDF();

    // Title & Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237); // PKXD Purple
    doc.text('PKXD Central - Lista Oficial de Participantes', 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Evento: ${event.name}`, 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Organizador: ${event.organizerName} | Categoria: ${event.category} | Data: ${event.date} às ${event.time}`, 14, 37);
    doc.text(`Total de Participantes Confirmados: ${list.length}`, 14, 43);

    // Line separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 48, 196, 48);

    // List of identifiers in 3 clean columns
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);

    let x = 14;
    let y = 58;
    const colWidth = 60;
    const maxY = 270;

    list.forEach((p, i) => {
      doc.text(`${i + 1}. ${p.playerIdentifier}`, x, y);
      y += 8;

      if (y > maxY) {
        y = 58;
        x += colWidth;
        if (x > 140) {
          doc.addPage();
          x = 14;
          y = 20;
        }
      }
    });

    // Save PDF file
    doc.save(`lista_participantes_${event.name.replace(/\s+/g, '_')}.pdf`);
    showToast('Documento PDF baixado!');
  };

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 z-50 bg-purple-900 border-2 border-pink-400 text-white font-sans text-xs font-black uppercase px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Section Header */}
      <div className="bg-gradient-to-r from-purple-900/80 via-zinc-900 to-indigo-950/80 border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        {/* Neon Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black uppercase rounded-lg">
              Comunidade PK XD 🎉
            </span>
            {pendingEventsCount > 0 && isAdmin && (
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase rounded-lg animate-pulse flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" /> {pendingEventsCount} Em Análise
              </span>
            )}
          </div>

          <h2 className="font-sans font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
            Central de <span className="text-yellow-300">Eventos</span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-gray-300 leading-relaxed">
            Crie seus próprios torneios, festas e encontros de PK XD ou confirme presença nos eventos da nossa comunidade para jogar junto com a galera!
          </p>
        </div>

        {/* Create Event Button */}
        <button
          onClick={() => {
            if (triggerAudio) triggerAudio('tap');
            setShowCreateModal(true);
          }}
          className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-sans text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl border border-pink-400/40 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2.5 flex-shrink-0"
        >
          <Plus className="w-5 h-5 text-yellow-300" />
          <span>Criar Novo Evento 🚀</span>
        </button>
      </div>

      {/* Categories & Filter Tabs */}
      <div className="space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => { if (triggerAudio) triggerAudio('tap'); setStatusFilter("TODOS"); }}
              className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === "TODOS"
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { if (triggerAudio) triggerAudio('tap'); setStatusFilter("AO_VIVO"); }}
              className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "AO_VIVO"
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Ao Vivo 🔴
            </button>
            <button
              onClick={() => { if (triggerAudio) triggerAudio('tap'); setStatusFilter("APROVADOS"); }}
              className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-extrabold uppercase transition-all cursor-pointer ${
                statusFilter === "APROVADOS"
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Confirmados ✅
            </button>
            {isAdmin && (
              <button
                onClick={() => { if (triggerAudio) triggerAudio('tap'); setStatusFilter("EM_ANALISE"); }}
                className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-extrabold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "EM_ANALISE"
                    ? 'bg-amber-500 text-purple-950 font-black shadow-md'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <span>Em Análise ⏳</span>
                {pendingEventsCount > 0 && (
                  <span className="bg-amber-950 text-amber-200 px-1.5 py-0.2 text-[9px] rounded-full">
                    {pendingEventsCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-neutral-400 px-2">
            Mostrando <strong>{filteredEvents.length}</strong> evento(s)
          </span>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (triggerAudio) triggerAudio('tap');
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                  : 'bg-neutral-900/60 text-neutral-400 border border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid Display */}
      {filteredEvents.length === 0 ? (
        <div className="bg-zinc-900/40 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-purple-400 mx-auto opacity-50" />
          <h3 className="font-sans font-black text-lg text-white uppercase">Nenhum evento encontrado</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Não há eventos disponíveis nesta categoria no momento. Seja o primeiro a divulgar um evento para a comunidade PK XD!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-sans text-xs font-black uppercase rounded-xl transition-all cursor-pointer mt-2"
          >
            Criar Evento Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const eventParts = participants.filter(p => p.eventId === event.id);
            const isFull = event.maxParticipants ? eventParts.length >= event.maxParticipants : false;

            return (
              <div
                key={event.id}
                className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl hover:border-purple-500/40 transition-all duration-300 group relative"
              >
                {/* Banner Header Image */}
                <div className="relative h-44 sm:h-48 w-full bg-black overflow-hidden flex-shrink-0">
                  <img
                    src={event.bannerUrl}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {event.status === 'Ao vivo' && (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        Ao Vivo 🔴
                      </span>
                    )}
                    {event.status === 'Em breve' && (
                      <span className="px-2.5 py-1 bg-cyan-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">
                        Em Breve ⏰
                      </span>
                    )}
                    {event.status === 'Aprovado' && (
                      <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg">
                        Confirmado ✅
                      </span>
                    )}
                    {event.status === 'Em análise' && (
                      <span className="px-2.5 py-1 bg-amber-500 text-purple-950 text-[10px] font-black uppercase rounded-lg shadow-lg">
                        Em Análise ⏳
                      </span>
                    )}
                    {event.status === 'Encerrado' && (
                      <span className="px-2.5 py-1 bg-neutral-800 text-neutral-400 text-[10px] font-black uppercase rounded-lg shadow-lg">
                        Encerrado 🏁
                      </span>
                    )}

                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-pink-300 border border-white/10 text-[10px] font-black uppercase rounded-lg">
                      {event.category}
                    </span>
                  </div>

                  {/* Event actions quick menu */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                      title="Excluir Evento / Torneio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Organizer Tag at bottom of banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-purple-200 bg-purple-950/80 backdrop-blur-md border border-purple-500/30 px-2.5 py-1 rounded-lg">
                      Organizado por: <strong>{event.organizerName}</strong>
                    </span>
                  </div>
                </div>

                {/* Event Details Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-sans font-black text-lg text-white uppercase tracking-wide leading-tight group-hover:text-yellow-300 transition-colors">
                      {event.name}
                    </h3>

                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
                      <span className="flex items-center gap-1 text-purple-300">
                        <Calendar className="w-3.5 h-3.5 text-pink-400" />
                        {event.date}
                      </span>
                      <span className="flex items-center gap-1 text-purple-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {event.time}
                      </span>
                    </div>
                  </div>

                  {/* Participants progress & Quick Copy for Organizer */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-pink-400" />
                        Confirmados:
                      </span>
                      <span className="text-white font-mono">
                        {eventParts.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : 'jogadores'}
                      </span>
                    </div>

                    {event.maxParticipants && (
                      <div className="w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-red-500' : 'bg-gradient-to-r from-pink-500 to-purple-600'
                          }`}
                          style={{ width: `${Math.min(100, (eventParts.length / event.maxParticipants) * 100)}%` }}
                        />
                      </div>
                    )}

                    {eventParts.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleCopyTagsFormatted(event, eventParts, 'lines')}
                          className="flex-1 py-1.5 px-2.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                          title="Copiar todas as tags dos participantes para colar no PK XD"
                        >
                          <Copy className="w-3.5 h-3.5 text-yellow-300" />
                          <span>Copiar {eventParts.length} Tags 📋</span>
                        </button>

                        <button
                          onClick={() => {
                            if (triggerAudio) triggerAudio('tap');
                            setShowDetailsModal(event);
                          }}
                          className="py-1.5 px-2.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 rounded-xl text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Ver lista detalhada de membros"
                        >
                          <Users className="w-3.5 h-3.5 text-pink-400" />
                          <span>Ver Lista</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleShareEvent(event)}
                      className="py-2.5 px-3 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      title="Compartilhar Link do Evento"
                    >
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Compartilhar 🔗</span>
                    </button>

                    <button
                      onClick={() => {
                        if (triggerAudio) triggerAudio('tap');
                        setShowDetailsModal(event);
                      }}
                      className="flex-1 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Detalhes 📋</span>
                    </button>

                    {event.status !== 'Encerrado' && (
                      <button
                        onClick={() => handleOpenPresenceModal(event)}
                        disabled={isFull}
                        className={`flex-1 py-2.5 px-3 font-sans text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isFull
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110 active:scale-95'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isFull ? 'Esgotado' : 'Confirmar Presença ✋'}</span>
                      </button>
                    )}

                    {/* Admin Status Approver dropdown */}
                    {isAdmin && (
                      <div className="w-full pt-1">
                        <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/10 text-[11px]">
                          <span className="text-amber-400 font-bold uppercase">Painel Admin:</span>
                          <select
                            value={event.status}
                            onChange={(e) => handleUpdateStatus(event.id, e.target.value as EventStatus)}
                            className="bg-neutral-800 border border-white/10 text-white font-bold rounded-lg px-2 py-1 text-[10px] cursor-pointer"
                          >
                            <option value="Em análise">⏳ Em análise</option>
                            <option value="Aprovado">✅ Aprovado</option>
                            <option value="Em breve">⏰ Em breve</option>
                            <option value="Ao vivo">🔴 Ao vivo</option>
                            <option value="Encerrado">🏁 Encerrado</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/40 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col relative shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-950 to-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-300">
                <Calendar className="w-5 h-5" />
                <h3 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-wider">
                  Criar Evento da Comunidade 🚀
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEventSubmit} className="flex flex-col flex-1 overflow-hidden text-left">
              <div className="p-5 space-y-4 overflow-y-auto max-h-[62vh] scrollbar-thin">
                
                {createSuccessMsg ? (
                  <div className="py-12 text-center space-y-3 animate-scale-up">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="font-sans font-black text-xl text-white uppercase">Evento Publicado com Sucesso!</h3>
                    <p className="text-xs text-neutral-300 max-w-md mx-auto">
                      Seu evento já está disponível e visível para toda a comunidade PK XD participar e confirmar presença! 🎉
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">Nome do Evento *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Torneio de Esconder-Esconder / Festa na Ilha"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400">Seu Nome / Nickname *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Seu Nickname ou Nome"
                          value={newOrganizerName}
                          onChange={(e) => setNewOrganizerName(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400">Categoria *</label>
                        <select
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-xl text-xs text-white font-bold cursor-pointer"
                        >
                          <option value="Torneios">🏆 Torneios</option>
                          <option value="Festas">🎉 Festas e Desfiles</option>
                          <option value="Esconder-Esconder">🙈 Esconder-Esconder</option>
                          <option value="Encontros de Creators">⭐ Encontros de Creators</option>
                          <option value="Desafios & Mini-Games">🕹️ Desafios & Mini-Games</option>
                          <option value="Outros">📁 Outros</option>
                          <option value="CUSTOM">➕ Criar Categoria...</option>
                        </select>
                      </div>
                    </div>

                    {newEventCategory === 'CUSTOM' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-pink-400">Nome da Nova Categoria</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Batalha de Dança"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-pink-500/30 rounded-xl text-xs text-white font-bold"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400">Data do Evento *</label>
                        <input
                          type="date"
                          required
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-neutral-400">Horário *</label>
                        <input
                          type="time"
                          required
                          value={newEventTime}
                          onChange={(e) => setNewEventTime(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">Descrição do Evento</label>
                      <textarea
                        rows={2}
                        placeholder="Descreva o objetivo do evento e o que vai acontecer..."
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">Regras e Instruções</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: 1. Não vale usar montaria. 2. Respeitar o horário..."
                        value={newEventRules}
                        onChange={(e) => setNewEventRules(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase text-neutral-400">Limite Máximo de Participantes (Opcional)</label>
                      <input
                        type="number"
                        placeholder="Ex: 50 (deixe em branco se for ilimitado)"
                        value={newMaxParticipants}
                        onChange={(e) => setNewMaxParticipants(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold"
                      />
                    </div>

                    {/* Banner Image Choice */}
                    <div className="space-y-2 border border-white/10 bg-black/20 p-3 rounded-2xl">
                      <label className="block text-[10px] font-extrabold uppercase text-neutral-400">
                        Banner do Evento (Foto do Aparelho ou Link) 🖼️
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl p-3 cursor-pointer transition-all">
                          <UploadCloud className="w-5 h-5 text-purple-400 mb-1" />
                          <span className="text-[10px] font-bold uppercase text-purple-300">
                            {newEventBanner.startsWith('data:') ? '✓ Imagem Selecionada!' : '📱 Enviar Foto do Celular'}
                          </span>
                          <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                        </label>
                      </div>

                      {newEventBanner && (
                        <div className="h-28 w-full rounded-xl overflow-hidden border border-white/10 bg-black relative">
                          <img src={newEventBanner} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewEventBanner('')}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!createSuccessMsg && (
                <div className="p-5 border-t border-white/10 bg-zinc-950 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Publicar Evento 🚀
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PRESENCE MODAL */}
      {showPresenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-pink-500/50 rounded-3xl p-6 w-full max-w-md relative shadow-2xl text-left space-y-4 overflow-hidden">
            
            <button
              onClick={() => {
                setShowPresenceModal(null);
                setPresenceError('');
              }}
              className="absolute top-4 right-4 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-pink-400">
              <UserCheck className="w-6 h-6" />
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider">
                Confirmar Presença ✋
              </h3>
            </div>

            <p className="text-xs text-neutral-300">
              Evento: <strong className="text-yellow-300">{showPresenceModal.name}</strong>
            </p>

            {presenceSuccess ? (
              <div className="py-6 text-center space-y-2 animate-scale-up">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-black text-white text-sm uppercase">Presença Confirmada!</h4>
                <p className="text-xs text-neutral-300">
                  Você foi adicionado à lista oficial de participantes! Nos vemos no evento! 🎉
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmPresence} className="space-y-4">
                {hasAutoFilledTag ? (
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-left">
                    <span className="text-lg">✨</span>
                    <div>
                      <p className="text-xs font-black text-emerald-300">Preenchimento Automático Ativo!</p>
                      <p className="text-[10px] text-emerald-200/80 leading-tight">
                        Tag PK XD vinculada ao seu perfil detectada: <strong className="font-mono text-white">{playerTagInput}</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-2 text-left">
                    <span className="text-base mt-0.5">ℹ️</span>
                    <div>
                      <p className="text-xs font-black text-amber-300">Sem Tag PK XD Vinculada</p>
                      <p className="text-[10px] text-amber-200/80 leading-tight">
                        Você ainda não cadastrou seu Nome e # no perfil. Digite manualmente abaixo ou configure no seu Passaporte para preenchimento automático nas próximas festas!
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-neutral-400">
                    Informe seu Identificador do PK XD *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: KOOSH#000 ou LUNA#245"
                    value={playerTagInput}
                    onChange={(e) => setPlayerTagInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 uppercase"
                  />
                  <p className="text-[10px] text-neutral-400 leading-tight">
                    Digite seu Nickname exatamente como aparece no PK XD com o código (ex: NICK#123).
                  </p>
                </div>

                {presenceError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 font-bold">
                    ⚠️ {presenceError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Confirmar Minha Presença 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS & PARTICIPANTS LIST MODAL */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
          <div className="bg-zinc-900 border-2 border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col relative shadow-2xl overflow-hidden text-left">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-950 to-zinc-900 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-[9px] font-black uppercase rounded">
                  {showDetailsModal.category}
                </span>
                <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider mt-1">
                  {showDetailsModal.name}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 max-h-[70vh] scrollbar-thin">
              
              {/* Event Info Card */}
              <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {showDetailsModal.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Data e Hora</span>
                    <strong className="text-purple-300">{showDetailsModal.date} às {showDetailsModal.time}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Organizador</span>
                    <strong className="text-yellow-300">{showDetailsModal.organizerName}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Status</span>
                    <strong className="text-pink-400">{showDetailsModal.status}</strong>
                  </div>
                </div>

                {showDetailsModal.rules && (
                  <div className="pt-2">
                    <span className="text-[10px] font-extrabold uppercase text-neutral-400 block mb-1">Regras do Evento:</span>
                    <div className="p-3 bg-black/60 rounded-xl text-xs text-neutral-300 font-mono leading-relaxed border border-white/5">
                      {showDetailsModal.rules}
                    </div>
                  </div>
                )}
              </div>

              {/* PARTICIPANTS SECTION / ORGANIZER COPY & PASTE PANEL */}
              {(() => {
                const eventParts = participants.filter(p => p.eventId === showDetailsModal.id);
                const filteredList = eventParts.filter(p => 
                  p.playerIdentifier.toLowerCase().includes(participantSearch.toLowerCase())
                );

                // Prepared text formats for easy copy-paste
                const linesText = eventParts.map(p => p.playerIdentifier).join('\n');
                const commaText = eventParts.map(p => p.playerIdentifier).join(', ');
                const numberedText = `[Lista de Membros - ${showDetailsModal.name}]\n` + eventParts.map((p, i) => `${i + 1}. ${p.playerIdentifier}`).join('\n');

                const activeFormattedText = copyFormatTab === 'lines' ? linesText : copyFormatTab === 'comma' ? commaText : numberedText;

                return (
                  <div className="space-y-4">
                    {/* Organizer / Host Highlight Box */}
                    <div className="bg-gradient-to-r from-yellow-500/10 via-purple-900/30 to-pink-500/10 border-2 border-yellow-400/30 p-4 rounded-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 font-black flex-shrink-0">
                            👑
                          </div>
                          <div>
                            <h4 className="font-sans font-black text-sm uppercase text-white tracking-wide flex items-center gap-2">
                              Painel de Membros & Tags (PK XD)
                            </h4>
                            <p className="text-[11px] text-yellow-200/80">
                              Copie as tags dos participantes para colar na busca de amigos do PK XD e convidá-los para sua festa!
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-yellow-400/20 text-yellow-300 font-mono text-xs font-bold rounded-xl border border-yellow-400/30 self-start sm:self-auto">
                          {eventParts.length} {eventParts.length === 1 ? 'membro' : 'membros'}
                        </span>
                      </div>

                      {/* Quick Copy Format Controls */}
                      {eventParts.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-white/10">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Format selector tabs */}
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-[10px] font-bold">
                              <button
                                onClick={() => setCopyFormatTab('lines')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'lines' ? 'bg-yellow-400 text-purple-950 font-black' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                1 por Linha
                              </button>
                              <button
                                onClick={() => setCopyFormatTab('comma')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'comma' ? 'bg-yellow-400 text-purple-950 font-black' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Separado por Vírgulas
                              </button>
                              <button
                                onClick={() => setCopyFormatTab('numbered')}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  copyFormatTab === 'numbered' ? 'bg-yellow-400 text-purple-950 font-black' : 'text-neutral-400 hover:text-white'
                                }`}
                              >
                                Numerado
                              </button>
                            </div>

                            {/* Main Copy Button */}
                            <button
                              onClick={() => handleCopyTagsFormatted(showDetailsModal, eventParts, copyFormatTab)}
                              className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg ${
                                copiedBatchFormat === copyFormatTab
                                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                  : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-purple-950 hover:brightness-110'
                              }`}
                            >
                              {copiedBatchFormat === copyFormatTab ? (
                                <>
                                  <Check className="w-4 h-4 text-white" />
                                  <span>Copiado com Sucesso! ✓</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copiar Todas as Tags 📋</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Live Copyable Box / Textarea */}
                          <div className="relative">
                            <textarea
                              readOnly
                              value={activeFormattedText}
                              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                              rows={Math.min(5, Math.max(2, eventParts.length))}
                              className="w-full p-3 bg-black/80 border border-yellow-400/30 rounded-xl text-xs font-mono text-yellow-300 leading-relaxed focus:outline-none focus:ring-1 focus:ring-yellow-400 cursor-text resize-none scrollbar-thin selection:bg-yellow-400 selection:text-purple-950"
                              placeholder="Nenhuma tag de jogador cadastrada ainda."
                            />
                            <span className="absolute right-3 bottom-2 text-[9px] font-mono text-neutral-500 pointer-events-none">
                              Clique no texto para selecionar tudo
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar: Export Buttons & Manual Add */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-black text-sm uppercase text-white flex items-center gap-2">
                          <Users className="w-4 h-4 text-pink-400" />
                          Membros Inscritos ({eventParts.length})
                        </h4>
                      </div>

                      {/* Export Toolbar */}
                      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => setShowQuickAdd(!showQuickAdd)}
                          className="px-2.5 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Adicionar jogador manualmente"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{showQuickAdd ? 'Fechar' : 'Add Jogador'}</span>
                        </button>

                        <button
                          onClick={() => handleExportExcel(showDetailsModal, eventParts)}
                          className="px-2.5 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                          title="Exportar em Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-3 h-3" /> Excel
                        </button>

                        <button
                          onClick={() => handleExportPDF(showDetailsModal, eventParts)}
                          className="px-2.5 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                          title="Exportar em PDF"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </button>

                        <button
                          onClick={() => handleExportTXT(showDetailsModal, eventParts)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all"
                          title="Exportar em TXT"
                        >
                          <Download className="w-3 h-3" /> TXT
                        </button>
                      </div>
                    </div>

                    {/* Manual Add Participant Box */}
                    {showQuickAdd && (
                      <div className="p-3.5 bg-purple-950/40 border border-pink-500/30 rounded-2xl space-y-2 animate-fade-in">
                        <span className="text-[11px] font-bold text-pink-300 uppercase block">
                          Adicionar Jogador Diretamente na Lista:
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tag no PK XD (ex: AMIGO#123)..."
                            value={quickAddTagInput}
                            onChange={(e) => setQuickAddTagInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 bg-black/70 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                          <button
                            onClick={() => handleQuickAddParticipant(showDetailsModal.id)}
                            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-sans text-xs font-black uppercase rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1 flex-shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogador na lista (ex: KOOSH#000)..."
                        value={participantSearch}
                        onChange={(e) => setParticipantSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    {/* Interactive List of Members with Individual Copy Buttons */}
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                      {filteredList.length === 0 ? (
                        <div className="p-8 text-center bg-black/40 rounded-2xl border border-dashed border-white/10">
                          <p className="text-neutral-400 text-xs font-sans">
                            {eventParts.length === 0 ? 'Nenhum participante confirmado ainda. Compartilhe o link do evento para os membros se inscreverem!' : 'Nenhum jogador encontrado com essa pesquisa.'}
                          </p>
                        </div>
                      ) : (
                        filteredList.map((p, idx) => {
                          const isCopied = copiedSingleTagId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-black/60 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/30 p-2.5 rounded-xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center font-mono text-[10px] text-neutral-400 font-bold">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <span className="font-mono text-xs font-bold text-white tracking-wider block">
                                    {p.playerIdentifier}
                                  </span>
                                  <span className="text-[9px] text-neutral-500 font-mono">
                                    Inscrito em {new Date(p.registeredAt).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleCopySingleTag(p.playerIdentifier, p.id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                                    isCopied
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-white/5 hover:bg-yellow-400/20 text-neutral-300 hover:text-yellow-300 border border-white/10 hover:border-yellow-400/30'
                                  }`}
                                  title="Copiar apenas esta tag"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-yellow-300" />
                                      <span>Copiar Tag</span>
                                    </>
                                  )}
                                </button>

                                {(isAdmin || (currentUser && showDetailsModal.createdById === currentUser.uid)) && (
                                  <button
                                    onClick={() => handleRemoveParticipant(p.id, p.playerIdentifier)}
                                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                    title="Remover jogador da lista"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between">
              <button
                onClick={() => {
                  const evId = showDetailsModal.id;
                  setShowDetailsModal(null);
                  handleDeleteEvent(evId);
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Evento</span>
              </button>

              <button
                onClick={() => setShowDetailsModal(null)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-sans text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
