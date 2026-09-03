import React from 'react';
import { ArchetypeTag } from '../../types/character';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'rigid' | 'endurer' | 'controller' | 'deprived' | 'purple' | 'cyan' | 'rose' | 'amber' | 'emerald' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses: Record<string, string> = {
    rigid: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    endurer: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    controller: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    deprived: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    purple: 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-sm',
    cyan: 'bg-cyan-950/60 text-cyan-200 border border-cyan-500/40',
    rose: 'bg-rose-950/60 text-rose-200 border border-rose-500/40',
    amber: 'bg-amber-950/60 text-amber-200 border border-amber-500/40',
    emerald: 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40',
    gray: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono tracking-tight ${sizeClasses} ${variantClasses[variant] || variantClasses.gray} ${className}`}
    >
      {children}
    </span>
  );
};

export const ArchetypeBadge: React.FC<{ archetype: ArchetypeTag | string; className?: string }> = ({
  archetype,
  className = '',
}) => {
  switch (archetype) {
    case 'Rigid':
      return <Badge variant="rigid" className={className}>🛡️ Rigid</Badge>;
    case 'Endurer':
      return <Badge variant="endurer" className={className}>⚓ Endurer</Badge>;
    case 'Controller':
      return <Badge variant="controller" className={className}>🔮 Controller</Badge>;
    case 'Deprived':
      return <Badge variant="deprived" className={className}>⛓️ Deprived</Badge>;
    default:
      return <Badge variant="gray" className={className}>{archetype}</Badge>;
  }
};
