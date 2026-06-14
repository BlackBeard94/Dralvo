"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-locale";
import { DASHBOARD_COPY } from "@/lib/i18n";
import type {
  Alert,
  AlertCondition,
  CreateAlertInput,
  MonitorState,
  UpdateAlertInput,
} from "@/types/alerts";
import { OPERATOR_OPTIONS } from "@/types/alerts";

const FORM_COPY = {
  vi: {
    edit: "Sửa quy tắc cảnh báo",
    create: "Quy tắc cảnh báo mới",
    target: "Mục tiêu",
    selectTarget: "Chọn luận điểm hoặc bằng chứng...",
    condition: "Điều kiện",
    stateBecomes: "Thông báo khi trạng thái trở thành",
    min: "Tối thiểu",
    max: "Tối đa",
    value: "Giá trị",
    active: "Đang bật",
    cancel: "Hủy",
    saving: "Đang lưu...",
    update: "Cập nhật",
    submitCreate: "Tạo",
    selectError: "Vui lòng chọn mục tiêu.",
    rangeError: "Min và Max phải là số hợp lệ.",
    valueError: "Giá trị phải là số hợp lệ.",
    saveError: "Không lưu được cảnh báo.",
    options: [
      ["thesis:overall", "Trạng thái luận điểm vàng"],
      ["thesis:price-relationship", "Quan hệ giá so với driver cơ bản"],
      ["thesis:xauusd-price-context", "Driver: Ngữ cảnh giá XAUUSD"],
      ["thesis:tips-real-yield", "Driver: Lợi suất thực TIPS 10Y"],
      ["thesis:cftc-gold-positioning", "Driver: Vị thế vàng CFTC"],
      ["thesis:comex-gold-inventory", "Driver: Tồn kho vàng COMEX"],
      ["thesis:gld-gold-holdings", "Driver: Lượng vàng GLD"],
      ["xauusd-spot", "Giá XAUUSD spot"],
      ["xauusd-rsi", "XAUUSD RSI (14)"],
      ["xauusd-macd", "XAUUSD MACD"],
      ["xauusd-sma", "XAUUSD SMA (9/20)"],
      ["tips-yields", "Lợi suất thực TIPS"],
      ["gold-btc-correlation", "Tương quan Gold-BTC"],
    ],
  },
  en: {
    edit: "Edit Alert Rule",
    create: "New Alert Rule",
    target: "Target",
    selectTarget: "Select a thesis or evidence target...",
    condition: "Condition",
    stateBecomes: "Notify when state becomes",
    min: "Min",
    max: "Max",
    value: "Value",
    active: "Active",
    cancel: "Cancel",
    saving: "Saving...",
    update: "Update",
    submitCreate: "Create",
    selectError: "Please select an indicator.",
    rangeError: "Min and Max must be valid numbers.",
    valueError: "Value must be a valid number.",
    saveError: "Failed to save alert.",
    options: [
      ["thesis:overall", "Gold thesis state"],
      ["thesis:price-relationship", "Price vs fundamental relationship"],
      ["thesis:xauusd-price-context", "Driver: XAUUSD Price Context"],
      ["thesis:tips-real-yield", "Driver: 10Y TIPS Real Yield"],
      ["thesis:cftc-gold-positioning", "Driver: CFTC Gold Positioning"],
      ["thesis:comex-gold-inventory", "Driver: COMEX Gold Inventory"],
      ["thesis:gld-gold-holdings", "Driver: GLD Gold Holdings"],
      ["xauusd-spot", "XAUUSD Spot Price"],
      ["xauusd-rsi", "XAUUSD RSI (14)"],
      ["xauusd-macd", "XAUUSD MACD"],
      ["xauusd-sma", "XAUUSD SMA (9/20)"],
      ["tips-yields", "TIPS Real Yields"],
      ["gold-btc-correlation", "Gold-BTC Correlation"],
    ],
  },
  "pt-BR": {
    edit: "Editar regra de alerta",
    create: "Nova regra de alerta",
    target: "Alvo",
    selectTarget: "Selecione uma tese ou evidência...",
    condition: "Condição",
    stateBecomes: "Notificar quando o estado se tornar",
    min: "Mínimo",
    max: "Máximo",
    value: "Valor",
    active: "Ativo",
    cancel: "Cancelar",
    saving: "Salvando...",
    update: "Atualizar",
    submitCreate: "Criar",
    selectError: "Selecione um alvo.",
    rangeError: "Mínimo e máximo devem ser números válidos.",
    valueError: "O valor deve ser um número válido.",
    saveError: "Falha ao salvar alerta.",
    options: [
      ["thesis:overall", "Estado da tese do ouro"],
      ["thesis:price-relationship", "Relação preço vs fundamentos"],
      ["thesis:xauusd-price-context", "Driver: Contexto XAUUSD"],
      ["thesis:tips-real-yield", "Driver: Juro real TIPS 10Y"],
      ["thesis:cftc-gold-positioning", "Driver: Posicionamento CFTC"],
      ["thesis:comex-gold-inventory", "Driver: Estoque COMEX"],
      ["thesis:gld-gold-holdings", "Driver: Reservas GLD"],
      ["xauusd-spot", "Preço spot XAUUSD"],
      ["xauusd-rsi", "XAUUSD RSI (14)"],
      ["xauusd-macd", "XAUUSD MACD"],
      ["xauusd-sma", "XAUUSD SMA (9/20)"],
      ["tips-yields", "Juros reais TIPS"],
      ["gold-btc-correlation", "Correlação Gold-BTC"],
    ],
  },
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (input: CreateAlertInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateAlertInput) => Promise<void>;
  editAlert?: Alert | null;
};

export function AlertForm({ open, onClose, editAlert, onSave, onUpdate }: Props) {
  const { locale } = useLocale();
  const copy = FORM_COPY[locale];
  const states = DASHBOARD_COPY[locale].states;
  const [indicatorKey, setIndicatorKey] = useState("");
  const [operator, setOperator] = useState<AlertCondition["operator"]>("gt");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [monitorState, setMonitorState] = useState<MonitorState>("supportive");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editAlert;

  useEffect(() => {
    if (editAlert) {
      setIndicatorKey(editAlert.indicator_key);
      setOperator(editAlert.condition_json.operator);
      setValue(editAlert.condition_json.value?.toString() ?? "");
      setMin(editAlert.condition_json.min?.toString() ?? "");
      setMax(editAlert.condition_json.max?.toString() ?? "");
      setMonitorState(editAlert.condition_json.state ?? "supportive");
      setActive(editAlert.active);
    } else {
      setIndicatorKey("");
      setOperator("gt");
      setValue("");
      setMin("");
      setMax("");
      setMonitorState("supportive");
      setActive(true);
    }
    setError("");
  }, [editAlert, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!indicatorKey) {
      setError(copy.selectError);
      return;
    }

    const thesisMonitor = indicatorKey.startsWith("thesis:");
    const condition: AlertCondition = thesisMonitor
      ? { operator: "state_is", state: monitorState }
      : { operator };

    if (thesisMonitor) {
      // State monitors do not require a numeric threshold.
    } else if (operator === "between") {
      const minNum = parseFloat(min);
      const maxNum = parseFloat(max);
      if (isNaN(minNum) || isNaN(maxNum)) {
        setError(copy.rangeError);
        return;
      }
      condition.min = minNum;
      condition.max = maxNum;
    } else {
      const valNum = parseFloat(value);
      if (isNaN(valNum)) {
        setError(copy.valueError);
        return;
      }
      condition.value = valNum;
    }

    setSaving(true);
    try {
      if (isEditing && editAlert) {
        await onUpdate(editAlert.id, {
          indicator_key: indicatorKey,
          condition_json: condition,
          active,
        });
      } else {
        await onSave({
          indicator_key: indicatorKey,
          condition_json: condition,
          active,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-deep/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md mx-4 rounded-xl border border-gold/20 bg-card p-6 shadow-2xl shadow-black/50 animate-fade-in-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg text-text-primary">
            {isEditing ? copy.edit : copy.create}
          </h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md border border-border text-text-muted hover:text-text-primary hover:border-gold/30 transition-colors font-mono text-sm"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">
              {copy.target}
            </label>
            <select
              value={indicatorKey}
              onChange={(e) => setIndicatorKey(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
            >
              <option value="" disabled>
                {copy.selectTarget}
              </option>
              {copy.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {!indicatorKey.startsWith("thesis:") && <div>
            <label className="block font-mono text-xs text-text-secondary mb-1.5">
              {copy.condition}
            </label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as AlertCondition["operator"])}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
            >
              {OPERATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>}

          {indicatorKey.startsWith("thesis:") ? (
            <div>
              <label className="block font-mono text-xs text-text-secondary mb-1.5">
                {copy.stateBecomes}
              </label>
              <select
                value={monitorState}
                onChange={(event) =>
                  setMonitorState(event.target.value as MonitorState)
                }
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary focus:border-gold/50 focus:outline-none transition-colors"
              >
                {(indicatorKey === "thesis:overall"
                  ? ["supportive", "mixed", "adverse", "insufficient_data"]
                  : indicatorKey === "thesis:price-relationship"
                    ? ["diverging", "confirming", "neutral", "insufficient_data"]
                    : ["supportive", "neutral", "adverse", "missing", "stale"]
                ).map((state) => (
                  <option key={state} value={state}>
                    {states[state as MonitorState]}
                  </option>
                ))}
              </select>
            </div>
          ) : operator === "between" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-xs text-text-secondary mb-1.5">
                  {copy.min}
                </label>
                <input
                  type="number"
                  step="any"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-text-secondary mb-1.5">
                  {copy.max}
                </label>
                <input
                  type="number"
                  step="any"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-mono text-xs text-text-secondary mb-1.5">
                {copy.value}
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 70"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-gold/50 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <label className="font-mono text-xs text-text-secondary">
              {copy.active}
            </label>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                active ? "bg-green" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  active ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>

          {error && (
            <p className="font-mono text-xs text-red">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 font-mono text-sm text-text-secondary hover:text-text-primary hover:border-gold/30 transition-colors"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-gold px-4 py-2 font-mono text-sm font-medium text-deep hover:bg-gold-bright transition-colors disabled:opacity-50"
            >
              {saving ? copy.saving : isEditing ? copy.update : copy.submitCreate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
