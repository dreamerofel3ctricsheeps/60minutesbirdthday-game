import React, { useEffect, useRef } from 'react';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { JOSE_SPRITES } from '@/data/characters/villainSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';
import type { EventChoice } from '@/types/game.types';

export interface ChatDisplayMessage {
  id: string;
  fromId: string;
  text: string;
}

interface WhatsappPanelProps {
  messages: ChatDisplayMessage[];
  pendingChoices: EventChoice[] | null;
  onPickChoice: (choice: EventChoice) => void;
  partyIds: string[];
  protagonistId: string;
}

/** Color del nombre del remitente dentro de su burbuja (estilo WhatsApp). */
const NAME_COLORS: Record<string, string> = {
  natalia: 'text-rose-300',
  saulo: 'text-amber-300',
  itzel: 'text-violet-300',
  fatima: 'text-orange-300',
  samantha: 'text-pink-300',
  majo: 'text-teal-300',
  alan: 'text-sky-300',
};

/**
 * Panel del grupo de WhatsApp de los amigos (Fase 4): la historia se
 * cuenta aquí y las decisiones se eligen como respuestas del
 * protagonista. Solo presentación: los efectos de cada choice los
 * aplica quien integra el panel (coordinador).
 *
 * Resolución de remitentes:
 *  - 'protagonist' (o el id mismo del protagonista): burbuja propia, a
 *    la derecha y en verde, sin nombre ni avatar.
 *  - 'amigo': se resuelve al primer partyId distinto del protagonista
 *    (si no hay, al protagonista, pero la burbuja va a la izquierda).
 *  - un id concreto: nombre y avatar de CHARACTERS_DATA / su bundle.
 *  - 'jose': no está en el grupo; llega como captura filtrada y se
 *    muestra con estilo de villano y el sprite JOSE_SPRITES.idle.
 */
export const WhatsappPanel: React.FC<WhatsappPanelProps> = ({
  messages,
  pendingChoices,
  onPickChoice,
  partyIds,
  protagonistId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan mensajes (o aparecen choices).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pendingChoices]);

  const protagonistName = CHARACTERS_DATA[protagonistId]?.name ?? 'el protagonista';
  const amigoId = partyIds.find((id) => id !== protagonistId) ?? protagonistId;
  const participantNames = partyIds
    .map((id) => CHARACTERS_DATA[id]?.name ?? id)
    .join(', ');

  const isOwn = (fromId: string) => fromId === 'protagonist' || fromId === protagonistId;

  const resolveSenderId = (fromId: string): string =>
    fromId === 'amigo' ? amigoId : fromId;

  const senderName = (fromId: string): string => {
    if (fromId === 'jose') return 'Jose 👀 (captura filtrada)';
    const resolved = resolveSenderId(fromId);
    return CHARACTERS_DATA[resolved]?.name ?? resolved;
  };

  const renderAvatar = (fromId: string) => {
    const anim =
      fromId === 'jose'
        ? JOSE_SPRITES.idle
        : getDefinedSpriteBundle(resolveSenderId(fromId)).idle_front;
    return (
      <div className="w-7 h-7 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-1 ring-white/10 flex items-start justify-center">
        <DefinedSprite2D anim={anim} height={26} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0b141a]">
      {/* Cabecera del grupo */}
      <header className="flex items-center gap-3 px-4 py-3 bg-[#075e54] shrink-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-950/60 ring-2 ring-white/20 flex items-center justify-center text-xl">
          🎂
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white leading-tight truncate">
            🎂 Cumpleaños sorpresa de Xime
          </div>
          <div className="text-[11px] text-emerald-100/80 leading-tight truncate">
            {participantNames || 'Grupo secreto 🤫'}
          </div>
        </div>
      </header>

      {/* Área de mensajes */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-500 italic">
              El grupo está en silencio… por ahora.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => {
              if (isOwn(msg.fromId)) {
                return (
                  <div
                    key={msg.id}
                    className="self-end max-w-[85%] rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 shadow"
                  >
                    <p className="text-[13px] leading-snug text-slate-50">{msg.text}</p>
                  </div>
                );
              }

              const isJose = msg.fromId === 'jose';
              const resolved = resolveSenderId(msg.fromId);
              return (
                <div key={msg.id} className="self-start flex items-end gap-1.5 max-w-[88%]">
                  {renderAvatar(msg.fromId)}
                  <div
                    className={`rounded-lg rounded-tl-none bg-[#202c33] px-3 py-2 shadow ${
                      isJose ? 'border-2 border-red-500/70 ring-1 ring-amber-400/40' : ''
                    }`}
                  >
                    <div
                      className={`text-[11px] font-bold leading-tight mb-0.5 ${
                        isJose
                          ? 'text-amber-300'
                          : NAME_COLORS[resolved] ?? 'text-emerald-300'
                      }`}
                    >
                      {senderName(msg.fromId)}
                    </div>
                    <p className="text-[13px] leading-snug text-slate-100">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {pendingChoices && (
              <p className="self-center text-[11px] text-slate-400 italic mt-1">
                ⌛ el grupo espera tu respuesta…
              </p>
            )}
          </div>
        )}
      </div>

      {/* Decisiones: respuestas del protagonista */}
      {pendingChoices && (
        <div className="shrink-0 border-t border-emerald-900/60 bg-[#111b21] px-3 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90 mb-2">
            Responder como {protagonistName}:
          </div>
          <div className="flex flex-col items-end gap-2">
            {pendingChoices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onPickChoice(choice)}
                className="max-w-[92%] text-left rounded-lg rounded-tr-none border border-emerald-500/70 bg-[#005c4b]/25 hover:bg-[#005c4b]/60 px-3 py-2 transition-colors"
              >
                <span className="block text-[13px] font-semibold leading-snug text-emerald-50">
                  {choice.label}
                </span>
                {choice.description && (
                  <span className="block text-[11px] leading-snug text-slate-400 mt-0.5">
                    {choice.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
