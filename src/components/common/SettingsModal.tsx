import React, { useState } from 'react';
import { Modal } from './Modal';
import { useCharacterStore } from '../../store/useCharacterStore';
import { useChatStore } from '../../store/useChatStore';
import { useModelStore } from '../../store/useModelStore';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Sparkles,
  Shield,
  Cpu,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { characters, resetToDefaults, exportAllCharactersJSON, importCharactersJSON } =
    useCharacterStore();
  const { sessions, resetCurrentSession } = useChatStore();
  const { providersStatus } = useModelStore();

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleExportDB = () => {
    const jsonStr = exportAllCharactersJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abyss-engine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('전체 로컬 데이터가 안전하게 백업 파일로 내보내졌습니다.');
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        '경고: 모든 캐릭터 데이터, 플레이 룸 대화 기록, 스탯 진행 상황이 초기 공장 출하 상태로 리셋됩니다. 계속하시겠습니까?'
      )
    ) {
      resetToDefaults();
      localStorage.removeItem('abyss-chat-sessions-v4');
      localStorage.removeItem('abyss-chat-sessions-v3');
      localStorage.removeItem('abyss-chat-sessions-v2');
      localStorage.removeItem('abyss-characters-vault-v1');
      window.location.reload();
    }
  };

  const handlePurgeOrphanSessions = () => {
    const validCharIds = new Set(characters.map((c) => c.id));
    const currentSessions = { ...sessions };
    let purgedCount = 0;

    for (const key of Object.keys(currentSessions)) {
      if (!validCharIds.has(key)) {
        delete currentSessions[key];
        purgedCount++;
      }
    }

    localStorage.setItem(
      'abyss-chat-sessions-v4',
      JSON.stringify({ state: { sessions: currentSessions } })
    );
    showToast(`${purgedCount}개의 미사용 잔여 세션 데이터가 완전히 정리되었습니다.`);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-purple-300">
          <Settings className="w-5 h-5 text-purple-400" />
          <span className="text-base font-bold">시스템 환경 및 로컬 스토리지 설정</span>
        </div>
      }
      subtitle="로컬 데이터베이스 관리, 잔여 세션 무결성 검사, API 연결 상태를 관리합니다."
      maxWidth="2xl"
    >
      <div className="space-y-5 text-xs">
        {toast && (
          <div className="p-3 bg-purple-950/80 border border-purple-500/60 rounded-xl text-purple-200 text-xs font-semibold animate-fadeIn">
            ✨ {toast}
          </div>
        )}

        {/* 1. API Status Overview */}
        <div className="p-4 rounded-xl bg-[#121528] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AI 엔진 및 API 연결 상태</span>
            </div>
            <span className="text-[11px] font-mono text-purple-400">Multi-Model Cascade v3.0</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Google Gemini</span>
              <span className="text-emerald-400 font-bold font-mono">
                {providersStatus.google ? '정상 가동 중 ✅' : '키 미설정 ⚠️'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Anthropic Claude</span>
              <span className="text-slate-400 font-bold font-mono">
                {providersStatus.anthropic ? '연결됨 ✅' : '크레딧 대기 ⚠️'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Local DB & Storage Management */}
        <div className="p-4 rounded-xl bg-[#121528] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>로컬 스토리지 무결성 & 세션 정리</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">100% Client-Side DB</span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            모든 캐릭터 데이터, 3-Tier 신경·메모리 원장, 턴별 스탯 이력은 외부 클라우드가 아닌 사용자의 로컬 브라우저 영구 저장소에 완벽히 암호화 격리 저장됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handlePurgeOrphanSessions}
              className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-cyan-500/30 transition-colors font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제된 캐릭터 세션 정리 (동기화)</span>
            </button>

            <button
              type="button"
              onClick={handleExportDB}
              className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/30 transition-colors font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>전체 데이터 백업 내보내기</span>
            </button>
          </div>
        </div>

        {/* 3. Factory Reset Section */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>위험 구역 (Factory Reset)</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            기존에 생성하거나 플레이한 모든 진행 상황을 완전히 삭제하고 초기 기본 캐릭터 상태로 되돌립니다.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/50 rounded-lg font-bold transition-colors cursor-pointer"
            >
              전체 데이터 공장 초기화
            </button>
          </div>
        </div>

        {/* Action Close */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};
